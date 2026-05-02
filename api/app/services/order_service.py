from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.order_models import Order, OrderItem, CommissionLedger
from app.models.order import OrderCreate, OrderOut, OrderItem as OrderItemSchema


COMMISSION_RATE = 0.15  # 15% de marge prélevée comme commission interne


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, payload: OrderCreate) -> OrderOut:
        paid_amount = sum(item.qty * item.unit_price for item in payload.items)
        commission_amount = round(paid_amount * COMMISSION_RATE, 2)

        order = Order(
            customer_id=payload.customer_id,
            stripe_payment_intent_id=payload.stripe_payment_intent_id,
            paid_amount=paid_amount,
            commission_amount=commission_amount,
            status="pending",
        )
        for item in payload.items:
            order.items.append(
                OrderItem(
                    product_id=item.product_id,
                    qty=item.qty,
                    unit_price=item.unit_price,
                )
            )

        commission = CommissionLedger(
            gross=commission_amount,
            fees=0,
            net=commission_amount,
            payout_status="pending",
        )
        order.commission = commission

        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return self._to_out(order)

    async def get_by_id(self, order_id: str) -> OrderOut | None:
        stmt = select(Order).where(Order.id == order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()
        return self._to_out(order) if order else None

    async def update_status(self, order_id: str, status: str) -> None:
        from sqlalchemy import update
        await self.db.execute(
            update(Order).where(Order.id == order_id).values(status=status)
        )
        await self.db.commit()

    def _to_out(self, order: Order) -> OrderOut:
        return OrderOut(
            id=order.id,
            customer_id=order.customer_id,
            items=[
                OrderItemSchema(
                    product_id=item.product_id,
                    qty=item.qty,
                    unit_price=float(item.unit_price),
                )
                for item in order.items
            ],
            paid_amount=float(order.paid_amount),
            commission_amount=float(order.commission_amount),
            status=order.status,
            created_at=order.created_at,
        )
