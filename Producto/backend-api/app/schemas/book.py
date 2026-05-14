from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_provider(lambda x: str(x))
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class Comment(BaseModel):
    user_id: int
    user_name: str
    content: str
    rating: int = Field(ge=1, le=5)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    is_new: bool = True
    status: str = "available"
    location: str = "Plaza de Maipú"
    price: Optional[float] = None
    delivery_type: str = "Retiro en biblioteca"
    owner_type: str = "Municipalidad de Maipú"
    pickup_location: str = "Plaza de Maipú"
    categories: List[str] = Field(default_factory=list)
    language: str = "Español"
    educational_level: str = "General"
    physical_condition: str = "Nuevo"
    image_url: Optional[str] = None
    publication_date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    sales_count: int = 0
    rating: float = 0.0
    comments: List[Comment] = Field(default_factory=list)

class BookCreate(BookBase):
    pass

class BookOut(BookBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    seller_id: int # El seller_id sigue siendo un ID de usuario en Postgres

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
