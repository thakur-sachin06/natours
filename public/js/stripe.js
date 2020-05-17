/* eslint-disable*/

import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_VVA1eT92UEJz1HOPWB1aZMXH00GZOIsFRl'); // public key from stripe

export const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error);
  }
};
