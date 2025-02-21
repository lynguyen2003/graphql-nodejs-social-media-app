/**
 * Check if email is valid
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
	if (!email) {
		return false;
	}
	const emailValidPattern = new RegExp(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);
	return emailValidPattern.test(email);
};

/**
 * Check if password is secure. Rules: At least 8 characters. It must contain numbers, lowercase letters and uppercase letters. The spaces are not allowed. Only english characters are allowed. This characters are not allowed: { } ( ) | ~ € ¿ ¬
 * @param {string} password
 * @returns {boolean}
 */
export const isStrongPassword = (password) => {
	if (!password) {
		return false;
	}
	const passwordValidPattern = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!*^?+-_@#$%&]{8,}$/);
	return passwordValidPattern.test(password);
};

/**
 * Check if phone number is valid (E.164 format)
 * Accepts formats:
 * - +84912345678 (Vietnam)
 * - +6591234567 (Singapore) 
 * - +12125551234 (US)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone: string): boolean => {
	if (!phone) {
	  return false;
	}
  
	// Basic E.164 format: + followed by 7-15 digits
	const basicE164Pattern = /^\+[1-9]\d{6,14}$/;
	if (!basicE164Pattern.test(phone)) {
	  return false;
	}
  
	// Specific country code validations
	const countryPatterns = {
	  // Vietnam: +84 followed by 9 digits
	  vietnam: /^\+84[3-9][0-9]{8}$/,
	  // US/Canada: +1 followed by 10 digits
	  northAmerica: /^\+1[2-9][0-9]{9}$/,
	  // Singapore: +65 followed by 8 digits
	  singapore: /^\+65[6-9][0-9]{7}$/
	  // Add more country patterns as needed
	};
  
	// Check if the number matches any country pattern
	return Object.values(countryPatterns).some(pattern => pattern.test(phone));
  };

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number with or without country code
 * @param {string} defaultCountry - Default country code (e.g., 'VN' for Vietnam)
 * @returns {string|null} - Formatted phone number or null if invalid
 */
export const formatPhoneNumber = (phone: string, defaultCountry = 'VN'): string | null => {
	if (!phone) {
	  return null;
	}
  
	// Remove all non-digit characters except '+'
	let cleaned = phone.replace(/[^\d+]/g, '');
  
	// If number doesn't start with +, add country code
	if (!cleaned.startsWith('+')) {
	  switch (defaultCountry) {
		case 'VN':
		  cleaned = '+84' + (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned);
		  break;
		case 'SG':
		  cleaned = '+65' + (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned);
		  break;
		case 'US':
		  cleaned = '+1' + (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned);
		  break;
		default:
		  return null;
	  }
	}
  
	return isValidPhone(cleaned) ? cleaned : null;
  };

