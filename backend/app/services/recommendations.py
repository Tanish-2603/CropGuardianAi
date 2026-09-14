from typing import List, Dict, Any

RECOMMENDATION_CATALOG = {
    "LOW": [
        {
            "priority": "LOW",
            "action": "Maintain routine scouting schedule",
            "rationale": "Field risk is low. Conduct next standard scan in 5–7 days to maintain ongoing baseline records."
        },
        {
            "priority": "LOW",
            "action": "Preserve canopy micro-climate balance",
            "rationale": "Ensure morning drip irrigation runs early so upper soil surface dries before peak midday temperatures."
        },
        {
            "priority": "LOW",
            "action": "Monitor beneficial insect presence",
            "rationale": "Inspect flowering clusters for natural pollinators and predatory beneficials to sustain biological resilience."
        }
    ],
    "MODERATE": [
        {
            "priority": "MEDIUM",
            "action": "Inspect lower canopy leaves and stems closely",
            "rationale": "Early blight and septoria spores develop first in lower foliage where moisture lingers. Check for concentric brown rings."
        },
        {
            "priority": "HIGH",
            "action": "Audit row drainage and clear furrow blockages",
            "rationale": "Upcoming weather indicators indicate high moisture. Ensure zero stagnant water pooling near root crowns."
        },
        {
            "priority": "MEDIUM",
            "action": "Avoid overhead sprinkler irrigation",
            "rationale": "Overhead watering extends leaf wetness duration beyond 6 hours, significantly increasing fungal spore penetration."
        },
        {
            "priority": "HIGH",
            "action": "Schedule follow-up scan within 48 hours",
            "rationale": "Evaluate whether lesion expansion accelerates under forecasted humidity."
        }
    ],
    "HIGH": [
        {
            "priority": "IMMEDIATE",
            "action": "Conduct immediate physical field inspection",
            "rationale": "High multimodal risk detected. Walk downwind field rows and identify symptomatic clusters before systemic spread."
        },
        {
            "priority": "IMMEDIATE",
            "action": "Prune and safely bag heavily infected lower foliage",
            "rationale": "Sanitizing blighted foliage reduces inoculum load. Do not compost infected leaves; disinfect shears with 70% alcohol between plants."
        },
        {
            "priority": "HIGH",
            "action": "Immediately suspend overhead watering and improve aeration",
            "rationale": "Switch irrigation solely to sub-surface drip or ground furrow. Stake drooping branches to improve canopy airflow."
        },
        {
            "priority": "URGENT",
            "action": "Consult local certified agronomist for intervention plan",
            "rationale": "CropGuardian is decision-support. For severe pressure, obtain certified extension verification before applying regulated chemical or bio-fungicide treatments."
        },
        {
            "priority": "HIGH",
            "action": "Rescan affected rows within 24 hours",
            "rationale": "Monitor whether containment measures stabilize the forward-looking 72-hour risk trajectory."
        }
    ]
}

def generate_recommendations(risk_level: str, cv_class: str, top_drivers: List[str]) -> List[Dict[str, Any]]:
    """
    Returns controlled, expert-reviewed action items based on risk tier and specific drivers.
    """
    catalog_items = RECOMMENDATION_CATALOG.get(risk_level, RECOMMENDATION_CATALOG["MODERATE"])
    results = [dict(item, is_completed=False) for item in catalog_items]

    # Specific driver tailoring
    driver_text = " ".join(top_drivers).lower()
    if "drainage" in driver_text or "soil saturation" in driver_text:
        # Prioritize drainage item
        for item in results:
            if "drainage" in item["action"].lower():
                item["priority"] = "IMMEDIATE"
    
    return results
