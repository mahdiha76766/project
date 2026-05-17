export const sendOrderConfirmationSms = async (mobile: string, orderId: string) => {
  console.log(`[SMS] Order ${orderId} confirmed for ${mobile}`);
  return { success: true };
};
