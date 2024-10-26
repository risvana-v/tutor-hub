var express = require("express");
var tutorHelper = require("../helper/tutorHelper");
var router = express.Router();
var fs = require("fs");
var adminHelper = require("../helper/adminHelper");
var userHelper = require("../helper/userHelper");


var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedIntutor) {
    next();
  } else {
    res.redirect("/tutor/signin");
  }
};

/* GET home page. */
router.get("/", verifySignedIn, async function (req, res, next) {
  let tutor = req.session.tutor;

  tutorHelper.getAllproducts().then((products) => {
    res.render("tutor/home", { admin: false, products, tutor });
  });
});


router.get("/all-orders", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let orders = await adminHelper.getAllOrders();
  res.render("tutor/all-orders", {
    admin: false,
    tutor,
    orders,
  });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let tutor = req.session.tutor;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("tutor/order-products", {
      admin: false,
      tutor,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  adminHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/tutor/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/tutor/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  adminHelper.cancelAllOrders().then(() => {
    res.redirect("/admin/all-orders");
  });
});

///////ALL product/////////////////////                                         
router.get("/all-subjects", verifySignedIn, function (req, res) {
  let tutor = req.session.tutor;
  tutorHelper.getAllproducts(req.session.tutor._id).then((products) => {
    res.render("tutor/subject/all-subjects", { admin: false, products, tutor });
  });
});

///////ADD product/////////////////////                                         
router.get("/add-subject", verifySignedIn, function (req, res) {
  let tutor = req.session.tutor;
  res.render("tutor/subject/add-subject", { admin: false, tutor });
});


router.post("/add-subject", function (req, res) {
  // Ensure the tutor is signed in and their ID is available
  if (req.session.signedIntutor && req.session.tutor && req.session.tutor._id) {
    const tutorId = req.session.tutor._id; // Get the tutor's ID from the session
    // Pass the tutorId to the addsub function
    tutorHelper.addproduct(req.body, tutorId, (productId, error) => {
      if (error) {
        console.log("Error adding product:", error);
        res.status(500).send("Failed to add product");
      } else {
        let image = req.files.Image;
        image.mv("./public/images/subject-images/" + productId + ".png", (err) => {
          if (!err) {
            res.redirect("/tutor/subject/all-subjects");
          } else {
            console.log("Error saving product image:", err);
            res.status(500).send("Failed to save product image");
          }
        });
      }
    });
  } else {
    // If the tutor is not signed in, redirect to the sign-in page
    res.redirect("/tutor/signin");
  }
});


///////EDIT product/////////////////////                                         
router.get("/edit-subject/:id", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let productId = req.params.id;
  let product = await tutorHelper.getproductDetails(productId);
  console.log(product);
  res.render("tutor/subject/edit-subject", { admin: false, product, tutor });
});

///////EDIT product/////////////////////                                         
router.post("/edit-subject/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  tutorHelper.updateproduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/subject-images/" + productId + ".png");
      }
    }
    res.redirect("/tutor/subject/all-subjects");
  });
});

///////DELETE product/////////////////////                                         
router.get("/delete-subject/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  tutorHelper.deleteproduct(productId).then((response) => {
    fs.unlinkSync("./public/images/subject-images/" + productId + ".png");
    res.redirect("/tutor/subject/all-subjects");
  });
});

///////DELETE ALL product/////////////////////                                         
router.get("/delete-all-subjects", verifySignedIn, function (req, res) {
  tutorHelper.deleteAllproducts().then(() => {
    res.redirect("/tutor/subject/all-subjects");
  });
});



////////////////////PROFILE////////////////////////////////////
router.get("/profile", function (req, res, next) {
  let tutor = req.session.tutor;
  res.render("tutor/profile", { admin: false, tutor });
});

router.get("/edit-profile/:id", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let tutorId = req.session.tutor._id;
  let tutorProfile = await tutorHelper.getTutorDetails(tutorId);
  res.render("tutor/edit-profile", { admin: false, tutorProfile, tutor });
});

router.post("/edit-profile/:id", verifySignedIn, async function (req, res) {
  try {
    const { Tutorname, Email, Phone, Address, City, Pincode } = req.body;
    let errors = {};

    // Validation checks
    if (!Tutorname || Tutorname.trim().length === 0) errors.tutorTutorname = 'Please enter your name.';
    if (!City || City.trim().length === 0) errors.city = 'Please enter your city.';
    if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) errors.email = 'Please enter a valid email address.';
    if (!Phone) errors.phone = "Please enter your phone number.";
    else if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";
    if (!Pincode) errors.pincode = "Please enter your pincode.";
    else if (!/^\d{6}$/.test(Pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
    if (!Address) errors.address = "Please enter your address.";

    // Re-render form if there are validation errors
    if (Object.keys(errors).length > 0) {
      let userProfile = await userHelper.getTutorDetails(req.params.id);
      return res.render("users/edit-profile", {
        admin: false,
        userProfile,
        user: req.session.user,
        errors,
        Tutorname,
        Email,
        Phone,
        Address,
        City,
        Pincode,
      });
    }

    // Update profile in the database
    await tutorHelper.updateTutorProfile(req.params.id, req.body);

    // Handle profile picture upload if present
    if (req.files && req.files.profile) {
      let profileImage = req.files.profile;
      profileImage.mv("./public/images/profile-images/" + req.params.id + ".png", (err) => {
        if (err) {
          console.error("Profile picture upload error:", err);
          return res.status(500).send("Failed to upload profile picture.");
        }
      });
    }

    // Handle certificate upload if present
    if (req.files && req.files.certificate) {
      let certificatePDF = req.files.certificate;
      certificatePDF.mv("./public/images/certificates/" + req.params.id + ".pdf", (err) => {
        if (err) {
          console.error("Certificate upload error:", err);
          return res.status(500).send("Failed to upload certificate.");
        }
      });
    }

    // Fetch the updated profile and update session
    let updatedTutorProfile = await tutorHelper.getTutorDetails(req.params.id);
    req.session.tutor = updatedTutorProfile;

    // Redirect to profile page
    res.redirect("/tutor/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating the profile.");
  }
});



router.get("/pending-approval", function (req, res) {
  if (!req.session.signedIntutor || req.session.tutor.approved) {
    res.redirect("/tutor");
  } else {
    res.render("tutor/pending-approval", {
      tutor: true, layout: "empty",
    });
  }
});


router.get("/signup", function (req, res) {
  if (req.session.signedIntutor) {
    res.redirect("/tutor");
  } else {
    res.render("tutor/signup", { admin: false, layout: 'admin-empty' });
  }
});

router.post("/signup", async function (req, res) {
  const { Tutorname, Email, Phone, Address, City, Pincode, Password } = req.body;
  let errors = {};

  // Field validations
  if (!Tutorname) errors.Tutorname = "Please enter your company name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Phone) errors.phone = "Please enter your phone number.";
  if (!Address) errors.address = "Please enter your address.";
  if (!City) errors.city = "Please enter your city.";
  if (!Pincode) errors.pincode = "Please enter your pincode.";
  if (!Password) errors.password = "Please enter a password.";

  // Check if email, company name, or phone already exists
  const existingEmail = await db.get()
    .collection(collections.TUTOR_COLLECTION)
    .findOne({ Email });
  if (existingEmail) errors.email = "This email is already registered.";

  const existingTutorname = await db.get()
    .collection(collections.TUTOR_COLLECTION)
    .findOne({ Tutorname });
  if (existingTutorname) errors.Tutorname = "This company name is already registered.";

  if (!/^\d{6}$/.test(Pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
  if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";
  const existingPhone = await db.get()
    .collection(collections.TUTOR_COLLECTION)
    .findOne({ Phone });
  if (existingPhone) errors.phone = "This phone number is already registered.";

  // If there are validation errors, re-render the form with the errors and user input
  if (Object.keys(errors).length > 0) {
    return res.render("tutor/signup", {
      tutor: true,
      layout: 'empty',
      errors,
      Tutorname,
      Email,
      Phone,
      Address,
      City,
      Pincode,
      Password
    });
  }

  // Proceed with signup
  tutorHelper.dosignup(req.body)
    .then((response) => {
      if (!response) {
        req.session.signUpErr = "Invalid Admin Code";
        return res.redirect("/tutor/signup");
      }

      // Set session and redirect to pending approval
      req.session.signedIntutor = true;
      req.session.tutor = response;
      res.redirect("/tutor/pending-approval");
    })
    .catch((err) => {
      console.log("Error during signup:", err);
      res.status(500).send("Error during signup");
    });
});



router.get("/signin", function (req, res) {
  if (req.session.signedIntutor) {
    res.redirect("/tutor");
  } else {
    res.render("tutor/signin", {
      tutor: true, layout: "empty",
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  // Validate Email and Password
  if (!Email || !Password) {
    req.session.signInErr = "Please fill all fields.";
    return res.redirect("/tutor/signin");
  }

  tutorHelper.doSignin(req.body)
    .then((response) => {
      if (response.status === true) {
        req.session.signedIntutor = true;
        req.session.tutor = response.tutor;
        res.redirect("/tutor");
      } else if (response.status === "pending") {
        req.session.signInErr = "This user is not approved by admin, please wait.";
        res.redirect("/tutor/signin");
      } else if (response.status === "rejected") {
        req.session.signInErr = "This user is rejected by admin.";
        res.redirect("/tutor/signin");
      } else {
        req.session.signInErr = "Invalid Email/Password";
        res.redirect("/tutor/signin");
      }
    })
    .catch((error) => {
      console.error(error);
      req.session.signInErr = "An error occurred. Please try again.";
      res.redirect("/tutor/signin");
    });
});


router.get("/signout", function (req, res) {
  req.session.signedIntutor = false;
  req.session.tutor = null;
  res.redirect("/");
});

router.get("/cart", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let tutorId = req.session.tutor._id;
  let cartCount = await tutorHelper.getCartCount(tutorId);
  let cartProducts = await tutorHelper.getCartProducts(tutorId);
  let total = null;
  if (cartCount != 0) {
    total = await tutorHelper.getTotalAmount(tutorId);
  }
  res.render("tutor/cart", {
    admin: false,
    tutor,
    cartCount,
    cartProducts,
    total,
  });
});

router.get("/add-to-cart/:id", function (req, res) {
  console.log("api call");
  let productId = req.params.id;
  let tutorId = req.session.tutor._id;
  tutorHelper.addToCart(productId, tutorId).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", function (req, res) {
  console.log(req.body);
  tutorHelper.changeProductQuantity(req.body).then((response) => {
    res.json(response);
  });
});

router.post("/remove-cart-product", (req, res, next) => {
  tutorHelper.removeCartProduct(req.body).then((response) => {
    res.json(response);
  });
});

router.get("/place-order", verifySignedIn, async (req, res) => {
  let tutor = req.session.tutor;
  let tutorId = req.session.tutor._id;
  let cartCount = await tutorHelper.getCartCount(tutorId);
  let total = await tutorHelper.getTotalAmount(tutorId);
  res.render("tutor/place-order", { admin: false, tutor, cartCount, total });
});

router.post("/place-order", async (req, res) => {
  let tutor = req.session.tutor;
  let products = await tutorHelper.getCartProductList(req.body.tutorId);
  let totalPrice = await tutorHelper.getTotalAmount(req.body.tutorId);
  tutorHelper
    .placeOrder(req.body, products, totalPrice, tutor)
    .then((orderId) => {
      if (req.body["payment-method"] === "COD") {
        res.json({ codSuccess: true });
      } else {
        tutorHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    });
});

router.post("/verify-payment", async (req, res) => {
  console.log(req.body);
  tutorHelper
    .verifyPayment(req.body)
    .then(() => {
      tutorHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment Failed" });
    });
});

router.get("/order-placed", verifySignedIn, async (req, res) => {
  let tutor = req.session.tutor;
  let tutorId = req.session.tutor._id;
  let cartCount = await tutorHelper.getCartCount(tutorId);
  res.render("tutor/order-placed", { admin: false, tutor, cartCount });
});

router.get("/orders", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let tutorId = req.session.tutor._id;
  let cartCount = await tutorHelper.getCartCount(tutorId);
  let orders = await tutorHelper.getTutorOrder(tutorId);
  res.render("tutor/orders", { admin: false, tutor, cartCount, orders });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let tutor = req.session.tutor;
    let tutorId = req.session.tutor._id;
    let cartCount = await tutorHelper.getCartCount(tutorId);
    let orderId = req.params.id;
    let products = await tutorHelper.getOrderProducts(orderId);
    res.render("tutor/order-products", {
      admin: false,
      tutor,
      cartCount,
      products,
    });
  }
);

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  tutorHelper.cancelOrder(orderId).then(() => {
    res.redirect("/orders");
  });
});

router.post("/search", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let tutorId = req.session.tutor._id;
  let cartCount = await tutorHelper.getCartCount(tutorId);
  tutorHelper.searchProduct(req.body).then((response) => {
    res.render("tutor/search-result", { admin: false, tutor, cartCount, response });
  });
});

module.exports = router;
