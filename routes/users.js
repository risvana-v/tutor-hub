var express = require("express");
var userHelper = require("../helper/userHelper");
var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/signin");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    let userId = req.session.user._id;
    cartCount = await userHelper.getCartCount(userId);
  }
  let tutors = await userHelper.getAllTutors();
  let products = await userHelper.getAllproducts();

  res.render("users/home", { admin: false, products, user, tutors, cartCount });
});

////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let user = req.session.user;
  res.render("users/profile", { admin: false, user });
});


router.get("/single-tutor/:id", async function (req, res) {
  let user = req.session.user;
  const tutorId = req.params.id; // Get tutor ID from URL

  try {
    const tutor = await userHelper.getTutorById(tutorId); // Pass the tutor ID to the function
    res.render("users/single-tutor", { admin: false, user, tutor });
  } catch (error) {
    console.error("Error fetching tutor:", error);
    res.status(500).send("Server Error");
  }
});


router.get("/edit-profile/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let userProfile = await userHelper.getUserDetails(userId);
  res.render("users/edit-profile", { admin: false, userProfile, user });
});

router.post("/edit-profile/:id", verifySignedIn, async function (req, res) {
  try {
    const { Fname, Lname, Email, Phone,
      // Address, District, Pincode 
    } = req.body;
    let errors = {};

    // Validate first name
    if (!Fname || Fname.trim().length === 0) {
      errors.fname = 'Please enter your first name.';
    }

    // if (!District || District.trim().length === 0) {
    //   errors.district = 'Please enter your first name.';
    // }

    // Validate last name
    if (!Lname || Lname.trim().length === 0) {
      errors.lname = 'Please enter your last name.';
    }

    // Validate email format
    if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Validate phone number
    if (!Phone) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^\d{10}$/.test(Phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }


    // Validate pincode
    // if (!Pincode) {
    //   errors.pincode = "Please enter your pincode.";
    // } else if (!/^\d{6}$/.test(Pincode)) {
    //   errors.pincode = "Pincode must be exactly 6 digits.";
    // }

    if (!Fname) errors.fname = "Please enter your first name.";
    if (!Lname) errors.lname = "Please enter your last name.";
    if (!Email) errors.email = "Please enter your email.";
    // if (!Address) errors.address = "Please enter your address.";
    // if (!District) errors.district = "Please enter your district.";

    // Validate other fields as needed...

    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
      let userProfile = await userHelper.getUserDetails(req.params.id);
      return res.render("users/edit-profile", {
        admin: false,
        userProfile,
        user: req.session.user,
        errors,
        Fname,
        Lname,
        Email,
        Phone,
        // Address,
        // District,
        // Pincode,
      });
    }

    // Update the user profile
    await userHelper.updateUserProfile(req.params.id, req.body);

    // Fetch the updated user profile and update the session
    let updatedUserProfile = await userHelper.getUserDetails(req.params.id);
    req.session.user = updatedUserProfile;

    // Redirect to the profile page
    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating the profile.");
  }
});





router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { admin: false, layout: 'admin-empty' });
  }
});

router.post("/signup", async function (req, res) {
  const { Fname, Lname, Email, Phone, Password } = req.body;
  let errors = {};

  // Check if email already exists
  const existingEmail = await db.get()
    .collection(collections.USERS_COLLECTION)
    .findOne({ Email });

  if (existingEmail) {
    errors.email = "This email is already registered.";
  }

  // Validate phone number length and uniqueness

  if (!Phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!/^\d{10}$/.test(Phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else {
    const existingPhone = await db.get()
      .collection(collections.USERS_COLLECTION)
      .findOne({ Phone });

    if (existingPhone) {
      errors.phone = "This phone number is already registered.";
    }
  }


  if (!Fname) errors.fname = "Please enter your first name.";
  if (!Lname) errors.lname = "Please enter your last name.";
  if (!Email) errors.email = "Please enter your email.";

  // Password validation
  if (!Password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(Password)) {
      errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render("users/signup", {
      admin: false,
      layout: 'admin-empty',
      errors,
      Fname,
      Lname,
      Email,
      Phone,
      Password
    });
  }

  // Proceed with signup
  userHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.user = response;
    res.redirect("/");
  }).catch((err) => {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred during signup.");
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signin", {
      admin: false,
      layout: 'admin-empty',
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});


router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    req.session.signInErr = "Please fill in all fields.";
    return res.render("users/signin", {
      admin: false,
      layout: 'admin-empty',
      signInErr: req.session.signInErr,
      email: Email,
      password: Password,

    });
  }

  userHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.render("users/signin", {
        admin: false,
        layout: 'admin-empty',
        signInErr: req.session.signInErr,
        Email,
        Password
      });
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/cart", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await userHelper.getCartCount(userId);
  let cartProducts = await userHelper.getCartProducts(userId);
  let total = null;
  if (cartCount != 0) {
    total = await userHelper.getTotalAmount(userId);
  }
  res.render("users/cart", {
    admin: false,
    user,
    cartCount,
    cartProducts,
    total,
  });
});

router.get("/add-to-cart/:id", function (req, res) {
  console.log("api call");
  let productId = req.params.id;
  let userId = req.session.user._id;
  userHelper.addToCart(productId, userId).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", function (req, res) {
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then((response) => {
    res.json(response);
  });
});

router.post("/remove-cart-product", (req, res, next) => {
  userHelper.removeCartProduct(req.body).then((response) => {
    res.json(response);
  });
});

router.get("/place-order", verifySignedIn, async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await userHelper.getCartCount(userId);
  let total = await userHelper.getTotalAmount(userId);
  res.render("users/place-order", { admin: false, user, cartCount, total });
});

router.post("/place-order", async (req, res) => {
  let user = req.session.user;
  let products = await userHelper.getCartProductList(req.body.userId);
  let totalPrice = await userHelper.getTotalAmount(req.body.userId);
  userHelper
    .placeOrder(req.body, products, totalPrice, user)
    .then((orderId) => {
      if (req.body["payment-method"] === "COD") {
        res.json({ codSuccess: true });
      } else {
        userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    });
});

router.post("/verify-payment", async (req, res) => {
  console.log(req.body);
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment Failed" });
    });
});

router.get("/order-placed", verifySignedIn, async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await userHelper.getCartCount(userId);
  res.render("users/order-placed", { admin: false, user, cartCount });
});

router.get("/orders", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let orderId = req.params.id;
  let cartCount = await userHelper.getCartCount(userId);
  let orders = await userHelper.getUserOrder(userId);
  let products = await userHelper.getOrderProducts(orderId);
  res.render("users/orders", { admin: false, user, cartCount, orders, products });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let user = req.session.user;
    let userId = req.session.user._id;
    let cartCount = await userHelper.getCartCount(userId);
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("users/order-products", {
      admin: false,
      user,
      cartCount,
      products,
    });
  }
);

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  userHelper.cancelOrder(orderId).then(() => {
    res.redirect("/orders");
  });
});

router.post("/search", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let cartCount = await userHelper.getCartCount(userId);
  userHelper.searchProduct(req.body).then((response) => {
    res.render("users/search-result", { admin: false, user, cartCount, response });
  });
});

module.exports = router;
