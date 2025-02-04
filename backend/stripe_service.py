from typing import Dict, Optional, Union
from datetime import datetime
import stripe
from firebase_admin import firestore
from flask import jsonify, request
import logging
from flask_cors import cross_origin

logger = logging.getLogger(__name__)


class StripeService:
    def __init__(self, db: firestore.Client):
        self.db = db

    def handle_checkout_completed(self, session: Dict) -> None:
        """Handle successful checkout completion"""
        try:
            customer_id = session['customer']
            subscription_id = session['subscription']
            user_id = session.get('client_reference_id')

            if not user_id:
                logger.error(
                    "No client_reference_id found in checkout session")
                return

            # Get subscription details
            subscription = stripe.Subscription.retrieve(subscription_id)

            # Determine plan type
            price_id = session.get('price')
            plan_type = self._get_plan_type(price_id)

            # Update subscription in Firestore
            self._update_subscription(
                user_id=user_id,
                customer_id=customer_id,
                subscription_id=subscription_id,
                plan_type=plan_type,
                expires_at=datetime.fromtimestamp(
                    subscription.current_period_end)
            )

        except Exception as e:
            logger.error(f"Error handling checkout completion: {str(e)}")
            raise

    def _get_plan_type(self, price_id: Optional[str]) -> str:
        """Determine the plan type based on price ID"""
        if not price_id:
            return 'monthly'

        try:
            price = stripe.Price.retrieve(price_id)
            return 'yearly' if price.id == 'price_1QQjEeIb7aERwB58FkccirOh' else 'monthly'
        except stripe.error.StripeError:
            return 'monthly'

    def handle_subscription_updated(self, subscription: Dict) -> None:
        """Handle subscription update events"""
        try:
            customer_id = subscription.get('customer')
            subscription_id = subscription.get('id')

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]
            user_id = user_doc.id

            # Update subscription status
            self._update_subscription(
                user_id=user_id,
                customer_id=customer_id,
                subscription_id=subscription_id,
                # Preserve existing plan type
                plan_type=user_doc.get('planType', 'monthly'),
                expires_at=datetime.fromtimestamp(
                    subscription['current_period_end'])
            )

        except Exception as e:
            logger.error(f"Error handling subscription update: {str(e)}")
            raise

    def handle_subscription_deleted(self, subscription: Dict) -> None:
        """Handle subscription deletion events"""
        try:
            customer_id = subscription.get('customer')

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update subscription status
            user_doc.reference.update({
                'status': 'cancelled',
                'updatedAt': datetime.now(),
                'canceledAt': datetime.now(),
                'expiresAt': datetime.fromtimestamp(subscription['current_period_end'])
            })

        except Exception as e:
            logger.error(f"Error handling subscription deletion: {str(e)}")
            raise

    def handle_trial_ending(self, subscription: Dict) -> None:
        """Handle trial ending events"""
        try:
            customer_id = subscription.get('customer')
            trial_end = subscription.get('trial_end')

            if not trial_end:
                return

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update trial end date
            user_doc.reference.update({
                'trialEndsAt': datetime.fromtimestamp(trial_end),
                'updatedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling trial end: {str(e)}")
            raise

    def handle_payment_succeeded(self, invoice: Dict) -> None:
        """Handle successful payment events"""
        try:
            customer_id = invoice.get('customer')
            subscription_id = invoice.get('subscription')

            if not subscription_id:
                return

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update payment status
            user_doc.reference.update({
                'lastPaymentStatus': 'succeeded',
                'lastPaymentDate': datetime.now(),
                'updatedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")
            raise

    def handle_payment_failed(self, invoice: Dict) -> None:
        """Handle failed payment events"""
        try:
            customer_id = invoice.get('customer')
            subscription_id = invoice.get('subscription')

            if not subscription_id:
                return

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update payment status
            user_doc.reference.update({
                'lastPaymentStatus': 'failed',
                'lastPaymentFailure': datetime.now(),
                'updatedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
            raise

    def handle_customer_deleted(self, customer: Dict) -> None:
        """Handle customer deletion events"""
        try:
            customer_id = customer.get('id')

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update customer status
            user_doc.reference.update({
                'status': 'deleted',
                'updatedAt': datetime.now(),
                'deletedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling customer deletion: {str(e)}")
            raise

    def handle_customer_updated(self, customer: Dict) -> None:
        """Handle customer update events"""
        try:
            customer_id = customer.get('id')

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update customer metadata if needed
            metadata = {
                'email': customer.get('email'),
                'name': customer.get('name'),
                'updatedAt': datetime.now()
            }

            user_doc.reference.update(metadata)

        except Exception as e:
            logger.error(f"Error handling customer update: {str(e)}")
            raise

    def handle_upcoming_invoice(self, invoice: Dict) -> None:
        """Handle upcoming invoice notification"""
        try:
            customer_id = invoice.get('customer')
            amount_due = invoice.get('amount_due')
            next_payment_attempt = invoice.get('next_payment_attempt')

            if not customer_id:
                return

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update upcoming payment information
            user_doc.reference.update({
                'upcomingPaymentAmount': amount_due,
                'nextPaymentAttempt': datetime.fromtimestamp(next_payment_attempt) if next_payment_attempt else None,
                'updatedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling upcoming invoice: {str(e)}")
            raise

    def handle_payment_method_attached(self, payment_method: Dict) -> None:
        """Handle payment method attachment"""
        try:
            customer_id = payment_method.get('customer')
            payment_method_id = payment_method.get('id')

            if not customer_id or not payment_method_id:
                return

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Update payment method information
            current_payment_methods = user_doc.get('paymentMethods', [])
            if payment_method_id not in current_payment_methods:
                current_payment_methods.append(payment_method_id)

            user_doc.reference.update({
                'paymentMethods': current_payment_methods,
                'updatedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling payment method attachment: {str(e)}")
            raise

    def handle_payment_method_detached(self, payment_method: Dict) -> None:
        """Handle payment method detachment"""
        try:
            customer_id = payment_method.get('customer')
            payment_method_id = payment_method.get('id')

            if not customer_id or not payment_method_id:
                return

            # Find user by customer ID
            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]

            # Remove payment method from list
            current_payment_methods = user_doc.get('paymentMethods', [])
            if payment_method_id in current_payment_methods:
                current_payment_methods.remove(payment_method_id)

            user_doc.reference.update({
                'paymentMethods': current_payment_methods,
                'updatedAt': datetime.now()
            })

        except Exception as e:
            logger.error(f"Error handling payment method detachment: {str(e)}")
            raise

    def _update_subscription(
        self,
        user_id: str,
        customer_id: str,
        subscription_id: str,
        plan_type: str,
        expires_at: datetime
    ) -> None:
        """Update subscription details in Firestore"""
        subscription_ref = self.db.collection(
            'subscriptions').document(user_id)
        subscription_ref.set({
            'status': 'active',
            'stripeCustomerId': customer_id,
            'stripeSubscriptionId': subscription_id,
            'planType': plan_type,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now(),
            'expiresAt': expires_at
        })

    def cancel_subscription(self, user_id: str) -> Dict:
        """Cancel a user's subscription"""
        try:
            subscription_ref = self.db.collection(
                'subscriptions').document(user_id)
            subscription_doc = subscription_ref.get()

            if not subscription_doc.exists:
                raise ValueError('No active subscription found')

            subscription_data = subscription_doc.to_dict()
            stripe_customer_id = subscription_data.get('stripeCustomerId')

            if not stripe_customer_id:
                raise ValueError('No Stripe customer ID found')

            # Get customer's subscriptions from Stripe
            subscriptions = stripe.Subscription.list(
                customer=stripe_customer_id,
                status='active',
                limit=1
            )

            if not subscriptions.data:
                raise ValueError('No active Stripe subscription found')

            stripe_subscription = subscriptions.data[0]

            # Cancel the subscription at period end
            stripe.Subscription.modify(
                stripe_subscription.id,
                cancel_at_period_end=True
            )

            # Update Firestore
            subscription_ref.update({
                'status': 'active',  # Still active until end of period
                'cancelAtPeriodEnd': True,
                'updatedAt': datetime.now(),
                'canceledAt': datetime.now()
            })

            return {
                'message': 'Subscription cancelled successfully',
                'willEndAt': datetime.fromtimestamp(stripe_subscription.current_period_end)
            }

        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            raise

    def reactivate_subscription(self, user_id: str) -> Dict:
        """Reactivate a cancelled subscription"""
        try:
            subscription_ref = self.db.collection(
                'subscriptions').document(user_id)
            subscription_doc = subscription_ref.get()

            if not subscription_doc.exists:
                raise ValueError('No subscription found')

            subscription_data = subscription_doc.to_dict()
            stripe_customer_id = subscription_data.get('stripeCustomerId')

            if not stripe_customer_id:
                raise ValueError('No Stripe customer ID found')

            # Get customer's subscriptions from Stripe
            subscriptions = stripe.Subscription.list(
                customer=stripe_customer_id,
                status='active',
                limit=1
            )

            if not subscriptions.data:
                raise ValueError('No active Stripe subscription found')

            stripe_subscription = subscriptions.data[0]

            # Remove the cancellation at period end
            stripe.Subscription.modify(
                stripe_subscription.id,
                cancel_at_period_end=False
            )

            # Update Firestore
            subscription_ref.update({
                'cancelAtPeriodEnd': False,
                'updatedAt': datetime.now(),
                'canceledAt': None
            })

            return {
                'message': 'Subscription reactivated successfully'
            }

        except Exception as e:
            logger.error(f"Error reactivating subscription: {str(e)}")
            raise

    def get_subscription_status(self, user_id: str) -> Dict:
        """Get the current subscription status for a user"""
        try:
            subscription_ref = self.db.collection(
                'subscriptions').document(user_id)
            subscription_doc = subscription_ref.get()

            if not subscription_doc.exists:
                return {
                    'status': 'inactive',
                    'isPremium': False
                }

            subscription_data = subscription_doc.to_dict()
            is_active = (
                subscription_data.get('status') == 'active' and
                subscription_data.get('expiresAt', datetime.now(
                )).timestamp() > datetime.now().timestamp()
            )

            return {
                'status': subscription_data.get('status'),
                'isPremium': is_active,
                'cancelAtPeriodEnd': subscription_data.get('cancelAtPeriodEnd', False),
                'expiresAt': subscription_data.get('expiresAt'),
                'planType': subscription_data.get('planType')
            }

        except Exception as e:
            logger.error(f"Error getting subscription status: {str(e)}")
            raise


def setup_stripe_routes(app, stripe_service: StripeService):
    """Set up all Stripe-related routes"""

    @app.route('/stripe-webhook', methods=['POST'])
    def stripe_webhook():
        payload = request.get_data()
        sig_header = request.headers.get('Stripe-Signature')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, stripe.webhook_secret
            )
        except ValueError:
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError:
            return jsonify({'error': 'Invalid signature'}), 400

        try:
            if event['type'] == 'checkout.session.completed':
                stripe_service.handle_checkout_completed(
                    event['data']['object'])
            return jsonify({'success': True})

        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/subscriptions/cancel', methods=['POST', 'OPTIONS'])
    @cross_origin(supports_credentials=True)
    def cancel_subscription():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response

        try:
            data = request.get_json()
            user_id = data.get('userId')

            if not user_id:
                return jsonify({'error': 'User ID is required'}), 400

            result = stripe_service.cancel_subscription(user_id)
            return jsonify(result)

        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except stripe.error.StripeError as e:
            return jsonify({
                'error': 'Payment processor error',
                'details': str(e)
            }), 500
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'details': str(e)
            }), 500

    @app.route('/api/subscriptions/reactivate', methods=['POST', 'OPTIONS'])
    @cross_origin(supports_credentials=True)
    def reactivate_subscription():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response

        try:
            data = request.get_json()
            user_id = data.get('userId')

            if not user_id:
                return jsonify({'error': 'User ID is required'}), 400

            result = stripe_service.reactivate_subscription(user_id)
            return jsonify(result)

        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except stripe.error.StripeError as e:
            return jsonify({
                'error': 'Payment processor error',
                'details': str(e)
            }), 500
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'details': str(e)
            }), 500

    @app.route('/api/subscriptions/status/<user_id>', methods=['GET'])
    @cross_origin(supports_credentials=True)
    def get_subscription_status(user_id: str):
        try:
            result = stripe_service.get_subscription_status(user_id)
            return jsonify(result)

        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'details': str(e)
            }), 500
