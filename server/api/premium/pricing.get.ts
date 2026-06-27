// FILE 9: /server/api/premium/pricing.get.ts
// ============================================================================
// GET /api/premium/pricing - Get pricing tiers
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    const pricing = {
      BASIC: {
        name: 'Basic',
        price: 4.99,
        currency: 'USD',
        period: 'month',
        features: [
          'Ad-free experience',
          'HD streaming (720p)',
          'Offline downloads',
          'Priority support'
        ],
        description: 'Perfect for casual users'
      },
      PREMIUM: {
        name: 'Premium',
        price: 9.99,
        currency: 'USD',
        period: 'month',
        features: [
          'All Basic features',
          '4K streaming',
          'Simultaneous streams (4)',
          'Custom profiles',
          'Early access to features',
          'Ad-free experience'
        ],
        description: 'For power users'
      },
      VIP: {
        name: 'VIP',
        price: 19.99,
        currency: 'USD',
        period: 'month',
        features: [
          'All Premium features',
          '8K streaming',
          'Unlimited simultaneous streams',
          'Priority customer support',
          'Exclusive content',
          'Custom themes',
          'Family sharing (6 accounts)',
          'Ad-free experience'
        ],
        description: 'Ultimate experience'
      }
    };

    return {
      success: true,
      data: pricing
    };
  } catch (error) {
    console.error('Error getting pricing:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get pricing information'
    });
  }
});
