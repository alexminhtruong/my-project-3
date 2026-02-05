/**
 * ==========================================
 * E-COMMERCE APPLICATION - MAIN FILE
 * ==========================================
 * Features:
 * - Product listing with filter & sort using price, category and alphabetical order.
 * - Shopping cart management where you can add, remove, increase, decrease items.
 * - Pricing rules:
 *   - Monday discount (10% before 10 AM)
 *   - Bulk discount (10+ items in same category)
 *  - Invoice payment limit (max 800 SEK)
 * - Dynamic pricing (weekend surcharge)
 * - Shipping cost calculation
 * - Payment method selection (card/invoice)
 * - Form input formatting
 * - Form submission handling
 * - Form validation
 * - Cart total calculation with all rules applied
 * - UI updates with animations
 * - Event handling for user interactions
 * Additional Features:
 * - Product quantity adjustment on listing page
 * - Visual selection of payment method
 * - Warning for invoice payment over limit
 * - Responsive design adjustments
 * Enhancements:
 * - Animated cart total changes
 * - Real-time form validation feedback
 * - Input formatting for card details and phone number
 * - Clear order on session timeout (15min)
 * - Payment method selection enforcement based on cart total
 * =========================================
 */

// ------------------------------------------
// 1. GLOBAL SETUP
// ------------------------------------------
// - Import product data
// - Initialize cart and filtered products
// - Select key DOM elements for product display and cart

import products from './products.mjs';

// ==========================================
// 1. GLOBAL VARIABLES & DOM ELEMENTS
// ==========================================
const cart = []; // Stores items user adds
let filteredProducts = Array.from(products); // Used for filter/sort logic
const productsListing = document.querySelector('#menuList'); // DOM element for product display
const cartTotalChange = document.querySelector('#cartTotal'); // DOM element for cart total
const cartSection = document.querySelector('#cart'); // DOM element for cart items

// ==========================================
// 2. SESSION TIMEOUT MANAGEMENT
// ==========================================
// - Set a timer to clear the order after inactivity
// - clearOrder(): Empties cart, resets forms, shows timeout message
// - resetTimeout(): Restarts timer on user activity
// - Add event listeners to reset timer on click, keypress, input
const INACTIVITY_TIMEOUT_MINUTES = 15;
let timeoutId = setTimeout(clearOrder, 1000 * 60 * INACTIVITY_TIMEOUT_MINUTES);

// Clears the cart and resets all forms when session times out
function clearOrder() {
  // Empty the cart array
  cart.length = 0;

  // Reset customer information form
  const orderForm = document.querySelector('#orderForm');
  if (orderForm) {
    orderForm.reset();
  }

  // Reset payment forms
  const cardPaymentForm = document.querySelector('#cardPaymentForm');
  const invoicePaymentForm = document.querySelector('#invoicePaymentForm');
  if (cardPaymentForm) cardPaymentForm.reset();
  if (invoicePaymentForm) invoicePaymentForm.reset();

  // Clear cart display and update totals
  printCart();
  updateCartTotals();

  // Show timeout message
  const timeOutText = document.querySelector('#timeOutText');
  if (timeOutText) {
    timeOutText.innerHTML = `<h2>Your session has expired due to inactivity. Your order has been cleared!</h2>`;
  }
}

// Restarts the session timeout timer on user activity
function resetTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(clearOrder, 1000 * 60 * INACTIVITY_TIMEOUT_MINUTES);
}

// Add listeners to reset timeout on user activity
// Listen for user activity to reset the timer
document.addEventListener('click', resetTimeout);
document.addEventListener('keypress', resetTimeout);
document.addEventListener('input', resetTimeout);

// ==========================================
// 3. PRICING RULES
// ==========================================
// - calculateProductPrice(basePrice): Adds weekend surcharge for chosen products
// - applyBulkDiscount(quantity, basePrice): Applies bulk discount for 10+ items
// - isInvoicePaymentAllowed(totalAmount): Invoice only for orders ≤ 800 SEK

// Rule 2: Weekend surcharge - 15% on chosen products (Friday 15:00 to Monday 03:00)
// Calculates product price, applies weekend surcharge if needed
function calculateProductPrice(basePrice) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Convert time to minutes since midnight for easier comparison
  const currentTimeInMinutes = hours * 60 + minutes;

  // Friday after 15:00 (15:00 = 900 minutes)
  const fridayStart = dayOfWeek === 5 && currentTimeInMinutes >= 900;
  // Saturday (all day)
  const saturday = dayOfWeek === 6;
  // Sunday and Monday early hours until 03:00 (03:00 = 180 minutes)
  const sundayToMondayNight = (dayOfWeek === 0 || dayOfWeek === 1) && currentTimeInMinutes < 180;

  // Check if weekend surcharge should be applied
  const isWeekendSurcharge = fridayStart || saturday || sundayToMondayNight;

  // Calculate final price with 15% surcharge if it's weekend
  const finalPrice = isWeekendSurcharge ? basePrice * 1.15 : basePrice;
  return finalPrice;
}

// Applies bulk discount if quantity threshold is met
function applyBulkDiscount(quantity, basePrice) {
  const BULK_THRESHOLD = 10;
  if (quantity >= BULK_THRESHOLD) {
    return {
      price: basePrice * 0.9,
      discountApplied: true,
      discountPercentage: 10,
    };
  }
  return {
    price: basePrice,
    discountApplied: false,
    discountPercentage: 0,
  };
}

// Checks if invoice payment is allowed based on total amount
function isInvoicePaymentAllowed(totalAmount) {
  const INVOICE_LIMIT = 800;
  return totalAmount <= INVOICE_LIMIT;
}

// ==========================================
// 4. PRODUCT DISPLAY & FILTERING
// ==========================================
// - Filter products by category
// - Sort products by price
// - Sort products alphabetically (not implemented here)
// - Render products to HTML
// - Attach event listeners to product buttons
// - Increase/decrease product quantity in listing

// Filter products by category
const filterList = document.querySelector('#filterList'); // Dropdown for filtering
filterList.addEventListener('change', filterProducts);

// Filters products by selected category
function filterProducts() {
  const selectedFilterValue = filterList.value;
  if (selectedFilterValue === 'all') {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(product => {
      return product.category === selectedFilterValue;
    });
  }
  printProducts();
}

// Sort products by price
const sortListByPrice = document.querySelector('#sortListByPrice'); // Dropdown for sorting
sortListByPrice.addEventListener('change', sortProducts);

// Sorts products by selected price order
function sortProducts() {
  const selectedSortValue = sortListByPrice.value;
  if (selectedSortValue === 'low') {
    filteredProducts.sort((product1, product2) => product1.price - product2.price);
  } else {
    filteredProducts.sort((product1, product2) => product2.price - product1.price);
  }
  printProducts();
}

// Display products in HTML
// Renders the filtered products to the product listing section
function printProducts() {
  productsListing.innerHTML = '';
  let html = '';
  for (let productIndex = 0; productIndex < filteredProducts.length; productIndex++) {
    const currentProduct = filteredProducts[productIndex];
    const displayPrice = calculateProductPrice(currentProduct.price);
    html += `
      <article>
        <h2>${currentProduct.name}</h2>
        <div class="product-image">
          <img 
            src="${currentProduct.img.src}"
            width="${currentProduct.img.width}"
            height="${currentProduct.img.height}"
            alt="${currentProduct.img.alt}"
            loading="lazy"
          >
        </div>
        <div class="metadata">
          <span>Product: ${currentProduct.id}</span>
          <span>Price: ${displayPrice.toFixed(2)} kr</span>
        </div>
        <div class="addToCart">
          <button class="decrease" data-id="${currentProduct.id}">-</button>
          <input type="number" id="amount-${currentProduct.id}" value="0" disabled>
          <label for="amount-${currentProduct.id}">
            <button class="increase" data-id="${currentProduct.id}">+</button>
          </label>
          <button class="buy" data-id="${currentProduct.id}">Buy</button>
        </div>
      </article>
    `;
  }
  productsListing.innerHTML = html;
  attachProductEventListeners(); // Attach event listeners to product buttons
}

// Attach event listeners to product buttons
// Attaches event listeners to product buttons for cart actions
function attachProductEventListeners() {
  const buyButtons = document.querySelectorAll('#menuList button.buy');
  buyButtons.forEach(btn => btn.addEventListener('click', addProductToCart));
  const increaseButtons = document.querySelectorAll('#menuList button.increase');
  increaseButtons.forEach(btn => btn.addEventListener('click', increaseProductCount));
  const decreaseButtons = document.querySelectorAll('#menuList button.decrease');
  decreaseButtons.forEach(btn => btn.addEventListener('click', decreaseProductCount));
}

// Adjust product quantity on listing page
// Increases product quantity in listing
function increaseProductCount(evt) {
  const clickedBtnId = evt.target.dataset.id;
  const input = document.querySelector(`#amount-${clickedBtnId}`);
  input.value = Number(input.value) + 1;
}

// Decreases product quantity in listing
function decreaseProductCount(evt) {
  const clickedBtnId = evt.target.dataset.id;
  const input = document.querySelector(`#amount-${clickedBtnId}`);
  let amount = Number(input.value) - 1;
  input.value = amount < 0 ? 0 : amount;
}

// ==========================================
// 5. SHOPPING CART MANAGEMENT
// ==========================================
// - Add product to cart
// - Render cart items
// - Attach event listeners to cart buttons
// - Increase/decrease quantity in cart, delete items

// Add product to cart
// Adds selected product and quantity to the cart and shows feedback
function addProductToCart(evt) {
  const clickedBtnId = Number(evt.target.dataset.id);
  const product = products.find(product => product.id === clickedBtnId);
  if (!product) return;
  const inputField = document.querySelector(`#amount-${clickedBtnId}`);
  const amount = Number(inputField.value);
  if (amount <= 0) return;
  inputField.value = 0;
  const index = cart.findIndex(product => product.id === clickedBtnId);
  if (index === -1) {
    product.amount = amount;
    cart.push(product);
  } else {
    cart[index].amount += amount;
  }
  updateCartTotals();
  printCart();

  // Show feedback message
  const feedback = document.getElementById('cart-feedback');
  if (feedback) {
    feedback.textContent = 'Added to cart!';
    feedback.classList.remove('hidden');
    setTimeout(() => {
      feedback.classList.add('hidden');
      feedback.textContent = '';
    }, 1500);
  }
}

// Display cart items
// Renders cart items to the cart section
function printCart() {
  cartSection.innerHTML = '';
  for (let cartIndex = 0; cartIndex < cart.length; cartIndex++) {
    cartSection.innerHTML += `
      <article>
        ${cart[cartIndex].name}:
        <button data-id="${cart[cartIndex].id}" class="decrease-cart-product">-</button>
        ${cart[cartIndex].amount} st
        <button data-id="${cart[cartIndex].id}" class="increase-cart-product">+</button>
        <button data-id="${cartIndex}" class="delete-product">
          <i class="fa fa-trash-o" aria-hidden="true" style="font-size:17px"></i>
        </button>
      </article>
    `;
  }
  attachCartEventListeners(); // Attach event listeners to cart buttons
}

// Attach event listeners to cart buttons
// Attaches event listeners to cart buttons for quantity and delete actions
function attachCartEventListeners() {
  const deleteButtons = document.querySelectorAll('button.delete-product');
  deleteButtons.forEach(btn => btn.addEventListener('click', handleDeleteCartItem));
  const decreaseButtons = document.querySelectorAll('button.decrease-cart-product');
  decreaseButtons.forEach(btn => btn.addEventListener('click', decreaseProductFromCart));
  const increaseButtons = document.querySelectorAll('button.increase-cart-product');
  increaseButtons.forEach(btn => btn.addEventListener('click', increaseProductFromCart));
}

// Adjust quantities in cart
// Decreases product quantity in cart
function decreaseProductFromCart(e) {
  const rowId = Number(e.target.dataset.id);
  const product = cart[rowId];
  if (product && product.amount > 0) {
    product.amount -= 1;
    printCart();
    updateCartTotals();
  }
}

// Increases product quantity in cart
function increaseProductFromCart(e) {
  const rowId = Number(e.target.dataset.id);
  const product = cart[rowId];
  if (product) {
    product.amount += 1;
    printCart();
    updateCartTotals();
  }
}

// Removes product from cart
function handleDeleteCartItem(e) {
  const rowId = Number(e.target.dataset.id);
  cart.splice(rowId, 1);
  printCart();
  updateCartTotals();
}

// ==========================================
// 6. CART TOTALS CALCULATION (ALL RULES APPLIED)
// ==========================================
// - Calculates total, applies discounts, shipping, updates UI
// - Highlights total change
// - Ensures payment section visibility is updated

// Calculates cart total, applies all pricing rules, updates UI
function updateCartTotals() {
  // Count items by category for bulk discount calculation (Rule 4)
  const categoryCount = {};
  cart.forEach(product => {
    categoryCount[product.category] = (categoryCount[product.category] || 0) + product.amount;
  });

  let cartTotal = 0;
  let bulkDiscountApplied = false;

  // Calculate cart total with weekend surcharge and bulk discounts
  for (let cartIndex = 0; cartIndex < cart.length; cartIndex++) {
    // Apply weekend surcharge (Rule 2)
    const priceWithSurcharge = calculateProductPrice(cart[cartIndex].price);

    // Apply bulk discount if category has 10+ items (Rule 4)
    const categoryQuantity = categoryCount[cart[cartIndex].category];
    const discountResult = applyBulkDiscount(categoryQuantity, priceWithSurcharge);

    let finalPrice = discountResult.price;
    if (discountResult.discountApplied) {
      bulkDiscountApplied = true;
    }

    const productSum = finalPrice * cart[cartIndex].amount;
    cartTotal += productSum;
  }

  // Apply Monday discount if applicable (Rule 1)
  let discountAmount = 0;
  const date = new Date();
  const MONDAY = 1;

  if (date.getDay() === MONDAY && date.getHours() < 10) {
    discountAmount = cartTotal * 0.1;
    document.querySelector('#discount').innerHTML =
      `Monday discount: 10% off entire order (-${discountAmount.toFixed(2)} kr)`;
  } else {
    document.querySelector('#discount').innerHTML = '';
  }

  const totalAfterDiscount = cartTotal - discountAmount;

  // Calculate shipping cost (Rule 5)
  let shippingCost = 0;
  const itemCount = cart.reduce((sum, product) => sum + product.amount, 0);

  if (itemCount > 15) {
    shippingCost = 0; // Free shipping for more than 15 items
    document.querySelector('#shippingCost').innerHTML = 'Freight: Free shipping!';
  } else if (itemCount > 0) {
    shippingCost = 25 + 0.1 * totalAfterDiscount; // 25 SEK base + 10% of total
    document.querySelector('#shippingCost').innerHTML = `Freight: ${shippingCost.toFixed(2)} kr`;
  } else {
    document.querySelector('#shippingCost').innerHTML = 'Freight: 0.00 kr';
  }

  // Calculate final total
  const finalTotal = totalAfterDiscount + shippingCost;
  cartTotalChange.innerHTML = `${finalTotal.toFixed(2)} kr`;

  // Display bulk discount message if applicable
  const discountElement = document.querySelector('#bulkDiscount');
  if (discountElement) {
    if (bulkDiscountApplied) {
      discountElement.innerHTML = 'Bulk discount: 10% off items (10+ per category)';
    } else {
      discountElement.innerHTML = '';
    }
  }

  highlightCartTotalChange(); // Animate cart total change

  // Ensure payment section visibility is updated after cart total changes
  const checkedBtn = document.querySelector('input[name="invoiceOrCard"]:checked');
  if (checkedBtn) {
    handlePaymentMethodToggle({ target: checkedBtn });
  }
}

// Animates cart total change for user feedback
function highlightCartTotalChange() {
  cartTotalChange.classList.add('highlight-price');
  setTimeout(() => cartTotalChange.classList.remove('highlight-price'), 1000);
}

// Initialize product display
// Initial product display
printProducts();

// ==========================================
// 7. FORM VALIDATION
// ==========================================
// - Define regex patterns for validation
// - Validate each field on focus out
// - Enable order button only if all fields are valid

// Validation regex patterns
// Validation regex patterns for each field
const validationPatterns = {
  firstName: /^(?!.*\.{2})(?!.*-{2})[a-zA-ZÅÄÖåäö]{2,}([\.\-]?[a-zA-ZÅÄÖåäö]+)*$/,
  lastName: /^(?!.*\.{2})(?!.*-{2})(?!.*'{2})[a-zA-ZÅÄÖåäö]{2,}([\.\-']?[a-zA-ZÅÄÖåäö]+)*$/,
  address: /^[A-Za-zÅÄÖåäö]+([\s\-][A-Za-zÅÄÖåäö]+)*\s+\d+[A-Za-z]?(\s*-\s*\d+[A-Za-z]?)?$/,
  zipcode: /^\d{3}\s?\d{2}$/,
  city: /^[A-Za-zÅÄÖåäö]+([\s\-][A-Za-zÅÄÖåäö]+)*$/,
  email: /^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/,
  phone: /^(\+46|0)[\s\-]?7[\s\-]?\d{1}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/,
};

// Generic validation function
// Validates a field and shows/hides error message
function validateField(fieldElement, patternKey) {
  const isValid = validationPatterns[patternKey].test(fieldElement.value);
  fieldElement.nextElementSibling.classList.toggle('hidden', isValid);
  return isValid;
}

// First Name validation and event
const firstName = document.querySelector('#firstname');
if (firstName) {
  // Ensure error span is hidden on load
  const errorSpan = firstName.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handleFirstNameFocusOut() {
    validateField(firstName, 'firstName');
  }
  firstName.addEventListener('focusout', handleFirstNameFocusOut);
}

function validateFirstNameField() {
  return firstName ? validateField(firstName, 'firstName') : true;
}

// Last Name validation and event
const lastName = document.querySelector('#lastname');
if (lastName) {
  const errorSpan = lastName.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handleLastNameFocusOut() {
    validateField(lastName, 'lastName');
  }
  lastName.addEventListener('focusout', handleLastNameFocusOut);
}

function validateLastNameField() {
  return lastName ? validateField(lastName, 'lastName') : true;
}

// Address validation and event
const address = document.querySelector('#adress');
if (address) {
  const errorSpan = address.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handleAddressFocusOut() {
    validateField(address, 'address');
  }
  address.addEventListener('focusout', handleAddressFocusOut);
}

function validateAdressField() {
  return address ? validateField(address, 'address') : true;
}

// Zipcode validation and event
const zipcode = document.querySelector('#zipcode');
if (zipcode) {
  const errorSpan = zipcode.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handleZipcodeFocusOut() {
    validateField(zipcode, 'zipcode');
  }
  zipcode.addEventListener('focusout', handleZipcodeFocusOut);
}

function validateZipcodeField() {
  return zipcode ? validateField(zipcode, 'zipcode') : true;
}

// City validation and event
const city = document.querySelector('#city');
if (city) {
  const errorSpan = city.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handleCityFocusOut() {
    validateField(city, 'city');
  }
  city.addEventListener('focusout', handleCityFocusOut);
}

function validateCityField() {
  return city ? validateField(city, 'city') : true;
}

// Email validation and event
const email = document.querySelector('#email');
if (email) {
  const errorSpan = email.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handleEmailFocusOut() {
    validateField(email, 'email');
  }
  email.addEventListener('focusout', handleEmailFocusOut);
}

function validateEmailField() {
  return email ? validateField(email, 'email') : true;
}

// Phone Number validation and event
const phoneNumber = document.querySelector('#phoneNumber');
if (phoneNumber) {
  const errorSpan = phoneNumber.nextElementSibling;
  if (errorSpan && errorSpan.classList) errorSpan.classList.add('hidden');
  function handlePhoneNumberFocusOut() {
    validateField(phoneNumber, 'phone');
  }
  phoneNumber.addEventListener('focusout', handlePhoneNumberFocusOut);
}

function validatePhoneNumberField() {
  return phoneNumber ? validateField(phoneNumber, 'phone') : true;
}

// Enables/disables order button based on validation
const orderBtn = document.querySelector('#orderBtn');

function toggleOrderButtonActive() {
  if (!orderBtn) return;

  orderBtn.setAttribute('disabled', 'disabled');

  const isValidFirstName = validateFirstNameField();
  if (!isValidFirstName) return;

  const isValidLastName = validateLastNameField();
  if (!isValidLastName) return;

  const isValidAdress = validateAdressField();
  if (!isValidAdress) return;

  const isValidZipcode = validateZipcodeField();
  if (!isValidZipcode) return;

  const isValidCity = validateCityField();
  if (!isValidCity) return;

  const isValidEmail = validateEmailField();
  if (!isValidEmail) return;

  const isValidPhoneNumberField = validatephoneNumberField();
  if (!isValidPhoneNumberField) return;

  orderBtn.removeAttribute('disabled');
}

// ==========================================
// 8. PAYMENT METHOD SELECTION (Rule 3)
// ==========================================
// - Add event listeners to payment radio buttons
// - handlePaymentMethodToggle(): Shows/hides payment sections, enforces invoice limit

const paymentRadioButtons = document.querySelectorAll('input[name="invoiceOrCard"]');
if (paymentRadioButtons.length === 0) {
  console.error('No payment radio buttons found. Check if HTML elements exist.');
} else {
  paymentRadioButtons.forEach(btn => {
    btn.addEventListener('change', handlePaymentMethodToggle);
  });
  // Ensure correct payment section is shown on page load
  const checkedBtn = document.querySelector('input[name="invoiceOrCard"]:checked');
  if (checkedBtn) {
    handlePaymentMethodToggle({ target: checkedBtn });
  }
}

// Handles payment method selection and UI toggling
function handlePaymentMethodToggle({ target }) {
  const method = target.value;
  const cardSection = document.querySelector('#cardPayment');
  const invoiceSection = document.querySelector('#invoicePayment');
  const totalAmount = parseFloat(cartTotalChange.innerHTML);

  // 1. Guard Clause: Handle the Invoice restriction first
  if (method === 'invoice' && !isInvoicePaymentAllowed(totalAmount)) {
    const warning = document.querySelector('.invoiceOver800Sum');
    if (warning) {
      warning.innerHTML = `<p>Invoice payment is only for orders under 800 SEK. Please use card payment for your order.</p>`; // Your warning HTML
    }
    target.checked = false;
    return; // Exit early
  }

  // 2. Toggle UI Visibility based on method
  const isInvoice = method === 'invoice';
  invoiceSection?.classList.toggle('hidden', !isInvoice);
  cardSection?.classList.toggle('hidden', isInvoice);
}

// Selects payment method visually and checks radio
function selectPayment(element) {
  // Remove selected class from all payment methods
  document.querySelectorAll('.payment-method').forEach(method => {
    method.classList.remove('selected');
  });

  // Add selected class to clicked element
  element.classList.add('selected');

  // Check the radio button
  element.querySelector('input[type="radio"]').checked = true;
}

// ==========================================
// 9. FORM INPUT FORMATTING
// ==========================================
// - Format card number, expiry, CVV, phone number as user types

// Format card number with spaces (every 4 digits)
const cardNumberInput = document.getElementById('cardNumber');
if (cardNumberInput) {
  function formatCardNumberInput(e) {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
  }
  cardNumberInput.addEventListener('input', formatCardNumberInput);
}

// Format expiry date as MM/YY
const expiryInput = document.getElementById('expiry');
if (expiryInput) {
  function formatExpiryInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
  }
  expiryInput.addEventListener('input', formatExpiryInput);
}

// Only allow numbers for CVV field
const cvvInput = document.getElementById('cvv');
if (cvvInput) {
  function formatCVVInput(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
  }
  cvvInput.addEventListener('input', formatCVVInput);
}

// Format phone number as (XXX) XXX-XXXX while user types
if (phoneNumber) {
  function formatPhoneNumberInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        // Keep as plain digits until more than 3 characters are entered
      } else if (value.length <= 6) {
        value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
      } else {
        value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
      }
    }
    e.target.value = value;
  }
  phoneNumber.addEventListener('input', formatPhoneNumberInput);
}

// ==========================================
// 10. FORM SUBMISSION HANDLERS
// ==========================================
// - Handle card payment form submit (demo alert)
// - Handle invoice payment form submit (demo alert, logs form data)

// Card payment form submission
const cardPaymentForm = document.getElementById('cardPaymentForm');
if (cardPaymentForm) {
  function handleCardPaymentSubmit(e) {
    e.preventDefault();
    alert('Payment form submitted! (This is a demo - no actual payment processed)');
  }
  cardPaymentForm.addEventListener('submit', handleCardPaymentSubmit);
}

// Invoice payment form submission
const invoicePaymentForm = document.getElementById('invoicePaymentForm');
if (invoicePaymentForm) {
  function handleInvoicePaymentSubmit(e) {
    e.preventDefault();
    alert('Invoice payment request submitted! You will receive a confirmation email shortly. (This is a demo)');
    console.log('Form data:', new FormData(e.target));
  }
  invoicePaymentForm.addEventListener('submit', handleInvoicePaymentSubmit);
}
