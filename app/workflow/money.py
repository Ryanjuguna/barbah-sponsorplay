"""Money handling.

Rules:
* All stored amounts are integer **minor units** (cents).
* Currency travels with every amount.
* The USD→KES rate is snapshotted at proposal creation and stored on the
  proposal. Nothing re-derives historical KES figures from today's rate.
* No floats in the money path.
"""

from dataclasses import dataclass
from typing import Dict

from app.config import settings


MINOR_PER_UNIT: Dict[str, int] = {"USD": 100, "KES": 100}


def to_minor(amount: float, currency: str = "USD") -> int:
    """Convert a major-unit amount to integer minor units."""
    factor = MINOR_PER_UNIT.get(currency.upper(), 100)
    # round() avoids 0.1-style representation drift before integer conversion
    return int(round(float(amount) * factor))


def from_minor(minor: int, currency: str = "USD") -> float:
    factor = MINOR_PER_UNIT.get(currency.upper(), 100)
    return round(int(minor) / factor, 2)


def format_minor(minor: int, currency: str = "USD") -> str:
    amount = from_minor(minor, currency)
    symbol = "$" if currency.upper() == "USD" else "KES "
    return f"{symbol}{amount:,.2f}"


def kes_from_usd(usd_minor: int, fx_rate: float) -> int:
    """Convert USD minor units to KES minor units using a snapshotted rate."""
    usd_major = from_minor(usd_minor, "USD")
    return to_minor(usd_major * float(fx_rate), "KES")


@dataclass(frozen=True)
class Split:
    """The money breakdown for a proposal or an offer."""

    gross_minor: int
    platform_fee_minor: int
    creator_pool_minor: int
    withholding_minor: int
    net_creator_minor: int
    currency: str

    def as_dict(self) -> Dict[str, int | str]:
        return {
            "gross_minor": self.gross_minor,
            "platform_fee_minor": self.platform_fee_minor,
            "creator_pool_minor": self.creator_pool_minor,
            "withholding_minor": self.withholding_minor,
            "net_creator_minor": self.net_creator_minor,
            "currency": self.currency,
        }


def split_gross(gross_minor: int, currency: str = "USD") -> Split:
    """Split a gross amount into platform fee, creator pool, WHT and net.

    Platform fee applies to the gross. Withholding tax applies to the creator
    pool (after the platform fee), which matches the legacy prototype's maths
    but in integer minor units.
    """
    platform_pct = settings.PLATFORM_COMMISSION_PERCENT / 100.0
    wht_pct = settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0

    platform_fee = int(round(gross_minor * platform_pct))
    creator_pool = gross_minor - platform_fee
    withholding = int(round(creator_pool * wht_pct))
    net_creator = creator_pool - withholding

    return Split(
        gross_minor=gross_minor,
        platform_fee_minor=platform_fee,
        creator_pool_minor=creator_pool,
        withholding_minor=withholding,
        net_creator_minor=net_creator,
        currency=currency,
    )


def split_from_pool(pool_minor: int, currency: str = "USD") -> Split:
    """Derive a full split when the creator pool is the fixed quantity.

    Milestone amounts in a proposal are slices of the creator pool, so when the
    brand edits them we recover the gross budget from the pool rather than
    treating the pool as gross.
    """
    platform_pct = settings.PLATFORM_COMMISSION_PERCENT / 100.0
    wht_pct = settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0

    if platform_pct >= 1:
        raise ValueError("Platform commission must be less than 100%")

    gross_minor = int(round(pool_minor / (1.0 - platform_pct)))
    platform_fee = gross_minor - pool_minor
    withholding = int(round(pool_minor * wht_pct))
    net_creator = pool_minor - withholding

    return Split(
        gross_minor=gross_minor,
        platform_fee_minor=platform_fee,
        creator_pool_minor=pool_minor,
        withholding_minor=withholding,
        net_creator_minor=net_creator,
        currency=currency,
    )


def allocate(total_minor: int, weights: list[int]) -> list[int]:
    """Split an integer total by integer weights without losing a cent.

    The remainder is distributed one minor unit at a time to the earliest
    entries, which keeps the sum exact.
    """
    if not weights:
        return []
    weight_sum = sum(weights)
    if weight_sum <= 0:
        return [0 for _ in weights]

    shares = [int(total_minor * w // weight_sum) for w in weights]
    remainder = total_minor - sum(shares)
    for i in range(remainder):
        shares[i % len(shares)] += 1
    return shares


def percent_of(total_minor: int, percent: float) -> int:
    return int(round(total_minor * (float(percent) / 100.0)))
