import os
from azure.cosmos import CosmosClient, PartitionKey, exceptions

_client = None
_db = None
_users_container = None
_meals_container = None


def _get_containers():
    global _client, _db, _users_container, _meals_container
    if _client is None:
        _client = CosmosClient(os.getenv("COSMOS_ENDPOINT"), os.getenv("COSMOS_KEY"))
        _db = _client.get_database_client(os.getenv("COSMOS_DATABASE"))
        _users_container = _db.get_container_client(os.getenv("COSMOS_USERS_CONTAINER"))
        _meals_container = _db.get_container_client(os.getenv("COSMOS_MEALS_CONTAINER"))
    return _users_container, _meals_container


def get_user_by_username(username: str):
    users, _ = _get_containers()
    query = "SELECT * FROM c WHERE c.username = @username"
    params = [{"name": "@username", "value": username}]
    items = list(users.query_items(query=query, parameters=params, enable_cross_partition_query=True))
    return items[0] if items else None


def create_user(user_doc: dict):
    users, _ = _get_containers()
    return users.create_item(body=user_doc)


def get_meals_by_date(user_id: str, date: str):
    _, meals = _get_containers()
    query = "SELECT * FROM c WHERE c.userId = @userId AND c.date = @date ORDER BY c.timestamp ASC"
    params = [
        {"name": "@userId", "value": user_id},
        {"name": "@date", "value": date},
    ]
    return list(meals.query_items(query=query, parameters=params, partition_key=user_id))


def get_meal_by_id(meal_id: str, user_id: str):
    _, meals = _get_containers()
    try:
        return meals.read_item(item=meal_id, partition_key=user_id)
    except exceptions.CosmosResourceNotFoundError:
        return None


def create_meal(meal_doc: dict):
    _, meals = _get_containers()
    return meals.create_item(body=meal_doc)


def delete_meal(meal_id: str, user_id: str):
    _, meals = _get_containers()
    meals.delete_item(item=meal_id, partition_key=user_id)


def update_meal_label(meal_id: str, user_id: str, label: str):
    _, meals = _get_containers()
    meal = get_meal_by_id(meal_id, user_id)
    if meal is None:
        return None
    meal["label"] = label
    return meals.replace_item(item=meal_id, body=meal)
