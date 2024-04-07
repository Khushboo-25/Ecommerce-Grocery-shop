let seacrhForm=document.querySelector('.search-form');

let scrol=false;

document.querySelector('#search-btn').onclick=()=>{
  
    seacrhForm.classList.toggle('active');
    // seacrhForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}
const shoppingCart = document.getElementById("shopping-cart");

document.querySelector('#cart-btn').onclick=()=>{
    
    shoppingCart.classList.toggle('active');
    seacrhForm.classList.remove('active');
    // shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}

let loginForm=document.querySelector('.login-form');

document.querySelector('#login-btn').onclick=()=>{
    loginForm.classList.toggle('active');
    seacrhForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    // loginForm.classList.remove('active');
    navbar.classList.remove('active');
}

let navbar=document.querySelector('.navbar');

document.querySelector('#menu-btn').onclick=()=>{
    navbar.classList.toggle('active');
    seacrhForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    // navbar.classList.remove('active');
}

window.onscroll=()=>{
    // seacrhForm.classList.remove('active');
    
    
    // shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}

// serach-box

// serach-box


document.addEventListener("DOMContentLoaded", function () {
  var mySwiper = new Swiper('.swiper.product-slider', {
    loop:true,
  spaceBetween: 20,
  autoplay:{
      delay: 7500,
      disableOnInteraction:false,
  },
  
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1020: {
      slidesPerView: 3,
    },
  },
  });
});
document.addEventListener("DOMContentLoaded", function () {
  var mySwiper = new Swiper('.swiper.review-slider', {
    loop:true,
  spaceBetween: 20,
  autoplay:{
      delay: 7500,
      disableOnInteraction:false,
  },
  
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1020: {
      slidesPerView: 3,
    },
  },
      // Your Swiper configuration options go here
      // slidesPerView: 3,
      // spaceBetween: 20,
      // Other options
  });
});

const cart = [];

    // Function to add a product to the cart
    function addToCart(productId, productName, productPrice,productsrc) {
        const existingProduct = cart.find((item) => item.id === productId);

        if (existingProduct) {

            // If the product is already in the cart, increase its quantity
            existingProduct.quantity++;
        } else {
            // If it's a new product, add it to the cart
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                quantity: 1,
                source:productsrc,
            });
            // console.log(cart);
        }
        
        // Update the shopping cart display
        updateCartDisplay();
    }
    function updateCartDisplay() {

      const cartTotalElement = document.querySelector('.total');
      const cartDisplay = document.querySelector('.shopping-cart');
      cartDisplay.innerHTML = '';
      // Calculate the total price and update the cart display
      const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      
      cart.forEach((product) => {
        // Create a new div element for the cart item
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('box');

        // Add the product details to the cart item
        cartItemDiv.innerHTML = `
            <i class="fa fa-trash" data-product-id="${product.id}"></i>
            <img src="${product.source}" alt="">
            <div class="content">
                <span class="price">$${product.price}/-</span>
                <span class="quantity">Qty: ${product.quantity}</span>
                <h3>${product.name}</h3>
            </div>
        `;

        // Append the cart item to the cart display
        cartDisplay.appendChild(cartItemDiv);
    });


    cartTotalElement.textContent = `Total: $${total}/-`;
    
    const ButtonBuy = document.createElement('div');
    ButtonBuy.classList.add('btn');
    if(total!==0)
    ButtonBuy.innerHTML = "Buy Now";
    else
    ButtonBuy.innerHTML="Checkout";
    cartDisplay.appendChild(cartTotalElement);
    cartDisplay.appendChild(ButtonBuy);
      // Update the total price display
      
  }
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const productId = button.getAttribute('data-product-id');
            // const productContainer = button.closest('.swiper-slide');
            const productsrc= `images/product-${productId}.png`;
            const productName = document.querySelector(`.product-${productId}-name`).textContent;
            const productPrice = parseFloat(document.querySelector(`.price-${productId}`).textContent.replace('$', ''));

            // Call the addToCart function to add the product to the cart
            addToCart(productId, productName, productPrice,productsrc);
        });
    });





   
        function removeFromCart(productId) {
          const productIndex = cart.findIndex((item) => item.id === productId);
        
          if (productIndex !== -1) {
            if (cart[productIndex].quantity > 1) {
              cart[productIndex].quantity--;
            } else {
              // If the product quantity is 1, remove it from the cart
              cart.splice(productIndex, 1);
            }
        
            // Update the shopping cart display
            updateCartDisplay();
        }
      }
      // Update the shopping cart display
      
  
    
    document.addEventListener('click', function (event) {
      if (event.target.classList.contains('fa-trash')) {
        // Find the parent cart item's product ID
        const productId = event.target.getAttribute('data-product-id');
        
        // Call the removeFromCart function to remove the product from the cart
        removeFromCart(productId);
      }
    });
    