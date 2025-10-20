/**
 * LNURL Utility Functions
 * Handles Lightning Network URL generation and encoding
 */

/**
 * Convert Lightning address to LNURL
 * @param {string} lightningAddress - Lightning address (e.g., alice@example.com)
 * @param {number} amountSats - Amount in satoshis
 * @returns {Promise<string>} LNURL string
 */
export async function lnurlFromLightningAddress(lightningAddress, amountSats) {
  try {
    const [username, domain] = lightningAddress.split("@");

    if (!username || !domain) {
      throw new Error("Invalid Lightning address format");
    }

    // Fetch LNURL from Lightning address endpoint
    const url = `https://${domain}/.well-known/lnurlp/${username}`;
    console.log("[LNURL] Fetching from:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch LNURL: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LNURL] Response:", data);

    if (data.status === "ERROR") {
      throw new Error(data.reason || "LNURL service error");
    }

    // Build callback URL with amount
    const callback = data.callback;
    const amountMsat = amountSats * 1000;
    const lnurlWithAmount = `${callback}?amount=${amountMsat}`;

    return lnurlWithAmount;
  } catch (error) {
    console.error("[LNURL] Error:", error);
    throw error;
  }
}

/**
 * Generate Lightning URI from Lightning address
 * @param {string} lightningAddress - Lightning address (e.g., alice@example.com)
 * @param {number} amountSats - Amount in satoshis
 * @returns {Promise<string>} Lightning URI for QR code
 */
export async function lightningUriFromAddress(lightningAddress, amountSats) {
  try {
    const [username, domain] = lightningAddress.split("@");

    if (!username || !domain) {
      throw new Error("Invalid Lightning address format");
    }

    // Fetch LNURL from Lightning address endpoint
    const url = `https://${domain}/.well-known/lnurlp/${username}`;
    console.log("[Lightning URI] Fetching from:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lightning address info: ${response.status}`);
    }

    const data = await response.json();
    console.log("[Lightning URI] Response:", data);

    if (data.status === "ERROR") {
      throw new Error(data.reason || "Lightning address service error");
    }

    // Get callback URL and fetch actual invoice
    const callback = data.callback;
    const amountMsat = amountSats * 1000;

    // Verify amount is within limits
    if (data.minSendable && amountMsat < data.minSendable) {
      throw new Error(`Amount too small. Minimum: ${data.minSendable / 1000} sats`);
    }
    if (data.maxSendable && amountMsat > data.maxSendable) {
      throw new Error(`Amount too large. Maximum: ${data.maxSendable / 1000} sats`);
    }

    const callbackUrl = `${callback}${callback.includes('?') ? '&' : '?'}amount=${amountMsat}`;
    console.log("[Lightning URI] Fetching invoice from:", callbackUrl);

    const invoiceResponse = await fetch(callbackUrl);
    if (!invoiceResponse.ok) {
      throw new Error(`Failed to fetch invoice: ${invoiceResponse.status}`);
    }

    const invoiceData = await invoiceResponse.json();
    console.log("[Lightning URI] Invoice data:", invoiceData);

    if (invoiceData.status === "ERROR") {
      throw new Error(invoiceData.reason || "Failed to generate invoice");
    }

    // Return the payment request (invoice)
    const invoice = invoiceData.pr;
    if (!invoice) {
      throw new Error("No payment request in response");
    }

    return invoice;
  } catch (error) {
    console.error("[Lightning URI] Error:", error);
    throw error;
  }
}

/**
 * Encode LNURL (bech32 encoding)
 * Note: This is a simplified version. For production, use a proper bech32 library
 * @param {string} url - URL to encode
 * @returns {string} Encoded LNURL
 */
export function encodeLnurl(url) {
  // For simplicity, we're using the callback URL directly
  // In production, you might want to use bech32 encoding
  return url;
}
