from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from backend.app.db.database import get_db
from backend.app.db.models import PromptTemplate
from backend.app.prompts.templates import (
    PROMPT_A_DIRECT_SYSTEM, PROMPT_A_DIRECT_USER,
    PROMPT_B_STRUCTURED_SYSTEM, PROMPT_B_STRUCTURED_USER
)

router = APIRouter(prefix="/prompts", tags=["Prompt Management"])

class PromptUpdate(BaseModel):
    system_prompt: str
    user_template: str

DEFAULT_PROMPTS = [
    {
        "name": "prompt_a_direct",
        "prompt_type": "direct",
        "description": "Prompt Design A (Direct Zero-Shot): concise instruction with target word count and schema formatting.",
        "system_prompt": PROMPT_A_DIRECT_SYSTEM,
        "user_template": PROMPT_A_DIRECT_USER,
        "version": 1,
        "is_default": True
    },
    {
        "name": "prompt_b_structured",
        "prompt_type": "structured",
        "description": "Prompt Design B (Structured Few-Shot): Master Tutor role, 4-phase reasoning scaffold, slide citations, and demonstration example.",
        "system_prompt": PROMPT_B_STRUCTURED_SYSTEM,
        "user_template": PROMPT_B_STRUCTURED_USER,
        "version": 1,
        "is_default": True
    }
]

async def ensure_prompts_seeded(db: AsyncSession):
    """Seeds default prompts into database if not present."""
    result = await db.execute(select(PromptTemplate))
    existing = result.scalars().all()
    if not existing:
        for p in DEFAULT_PROMPTS:
            tmpl = PromptTemplate(
                name=p["name"],
                prompt_type=p["prompt_type"],
                description=p["description"],
                system_prompt=p["system_prompt"],
                user_template=p["user_template"],
                version=p["version"],
                is_default=True
            )
            db.add(tmpl)
        await db.commit()

@router.get("")
async def get_prompts(db: AsyncSession = Depends(get_db)):
    """Returns all active prompt templates."""
    await ensure_prompts_seeded(db)
    result = await db.execute(select(PromptTemplate))
    prompts = result.scalars().all()
    return prompts

@router.put("/{name}")
async def update_prompt(
    name: str,
    update: PromptUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Updates prompt template text and increments version."""
    await ensure_prompts_seeded(db)
    result = await db.execute(select(PromptTemplate).where(PromptTemplate.name == name))
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=404, detail=f"Prompt '{name}' not found.")

    tmpl.system_prompt = update.system_prompt
    tmpl.user_template = update.user_template
    tmpl.version += 1
    tmpl.is_default = False
    await db.commit()
    await db.refresh(tmpl)
    return tmpl

@router.post("/reset")
async def reset_prompts(db: AsyncSession = Depends(get_db)):
    """Resets all prompt templates to baseline default configurations."""
    for p in DEFAULT_PROMPTS:
        result = await db.execute(select(PromptTemplate).where(PromptTemplate.name == p["name"]))
        tmpl = result.scalar_one_or_none()
        if tmpl:
            tmpl.system_prompt = p["system_prompt"]
            tmpl.user_template = p["user_template"]
            tmpl.version += 1
            tmpl.is_default = True
        else:
            new_tmpl = PromptTemplate(
                name=p["name"],
                prompt_type=p["prompt_type"],
                description=p["description"],
                system_prompt=p["system_prompt"],
                user_template=p["user_template"],
                version=1,
                is_default=True
            )
            db.add(new_tmpl)
    await db.commit()
    return {"status": "success", "message": "All prompts reset to baseline defaults."}
