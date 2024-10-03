var express = require("express");
var tutorHelper = require("../helper/tutorHelper");
var router = express.Router();
var fs = require("fs");

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
router.get("/", async function (req, res, next) {
  let tutor = req.session.tutor;

  tutorHelper.getAllsubjects().then((subjects) => {
    res.render("tutor/home", { admin: false, subjects, tutor });
  });
});


///////ALL subject/////////////////////                                         
router.get("/all-subjects", verifySignedIn, function (req, res) {
  let tutor = req.session.tutor;
  tutorHelper.getAllsubjects(req.session.tutor._id).then((subjects) => {
    res.render("tutor/subject/all-subjects", { admin: false, subjects, tutor });
  });
});

///////ADD subject/////////////////////                                         
router.get("/add-subject", verifySignedIn, function (req, res) {
  let tutor = req.session.tutor;
  res.render("tutor/subject/add-subject", { admin: false, tutor });
});


router.post("/add-subject", function (req, res) {
  // Ensure the builder is signed in and their ID is available
  if (req.session.signedIntutor && req.session.tutor && req.session.tutor._id) {
    const tutorId = req.session.tutor._id; // Get the tutor's ID from the session
    // Pass the tutorId to the addsub function
    tutorHelper.addsubject(req.body, tutorId, (subjectId, error) => {
      if (error) {
        console.log("Error adding subject:", error);
        res.status(500).send("Failed to add subject");
      } else {
        let image = req.files.Image;
        image.mv("./public/images/subject-images/" + subjectId + ".png", (err) => {
          if (!err) {
            res.redirect("/tutor/subject/all-subjects");
          } else {
            console.log("Error saving subject image:", err);
            res.status(500).send("Failed to save subject image");
          }
        });
      }
    });
  } else {
    // If the tutor is not signed in, redirect to the sign-in page
    res.redirect("/tutor/signin");
  }
});


///////EDIT subject/////////////////////                                         
router.get("/edit-subject/:id", verifySignedIn, async function (req, res) {
  let tutor = req.session.tutor;
  let subjectId = req.params.id;
  let subject = await tutorHelper.getsubjectDetails(subjectId);
  console.log(subject);
  res.render("tutor/subject/edit-subject", { admin: false, subject, tutor });
});

///////EDIT subject/////////////////////                                         
router.post("/edit-subject/:id", verifySignedIn, function (req, res) {
  let subjectId = req.params.id;
  tutorHelper.updatesubject(subjectId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/subject-images/" + subjectId + ".png");
      }
    }
    res.redirect("/tutor/subject/all-subjects");
  });
});

///////DELETE subject/////////////////////                                         
router.get("/delete-subject/:id", verifySignedIn, function (req, res) {
  let subjectId = req.params.id;
  tutorHelper.deletesubject(subjectId).then((response) => {
    fs.unlinkSync("./public/images/subject-images/" + subjectId + ".png");
    res.redirect("/tutor/subject/all-subjects");
  });
});

///////DELETE ALL subject/////////////////////                                         
router.get("/delete-all-subjects", verifySignedIn, function (req, res) {
  tutorHelper.deleteAllsubjects().then(() => {
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

    // Validate first name
    if (!Tutorname || Tutorname.trim().length === 0) {
      errors.tutorTutorname = 'Please enter your first name.';
    }

    if (!City || City.trim().length === 0) {
      errors.city = 'Please enter your first name.';
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
    if (!Pincode) {
      errors.pincode = "Please enter your pincode.";
    } else if (!/^\d{6}$/.test(Pincode)) {
      errors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (!Tutorname) errors.tutorTutorname = "Please enter your name.";
    if (!Email) errors.email = "Please enter your email.";
    if (!Address) errors.address = "Please enter your address.";
    if (!City) errors.city = "Please enter your city.";

    // Validate other fields as needed...

    // If there are validation errors, re-render the form with error messages
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

    // Update the user profile
    await tutorHelper.updateTutorProfile(req.params.id, req.body);

    // Fetch the updated user profile and update the session
    let updatedTutorProfile = await tutorHelper.getTutorDetails(req.params.id);
    req.session.tutor = updatedTutorProfile;

    // Redirect to the profile page
    res.redirect("/tutor/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating the profile.");
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
  if (!Tutorname) errors.tutorname = "Please enter your full name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Phone) errors.phone = "Please enter your phone number.";
  if (!Address) errors.address = "Please enter your address.";
  if (!City) errors.city = "Please enter your city.";
  if (!Pincode) errors.pincode = "Please enter your pincode.";

  if (!Password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(Password)) {
      errors.password = "Password must be at least 8 characters long ";
    }
  }

  // Check if email or company name already exists
  const existingEmail = await db.get()
    .collection(collections.TUTOR_COLLECTION)
    .findOne({ Email });
  if (existingEmail) errors.email = "This email is already registered.";

  const existingTutorname = await db.get()
    .collection(collections.TUTOR_COLLECTION)
    .findOne({ Tutorname });
  if (existingTutorname) errors.tutorname = "This name is already registered.";

  // Validate Pincode and Phone
  if (!/^\d{6}$/.test(Pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
  if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";
  const existingPhone = await db.get()
    .collection(collections.TUTOR_COLLECTION)
    .findOne({ Phone });
  if (existingPhone) errors.phone = "This phone number is already registered.";

  // If there are validation errors, re-render the form
  if (Object.keys(errors).length > 0) {
    console.log(errors); // This will print out the errors for debugging
    return res.render("tutor/signup", {
      tutor: true,
      layout: 'admin-empty',
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
  tutorHelper.doSignup(req.body).then((response) => {
    if (!response) {
      req.session.signUpErr = "Invalid Admin Code";
      return res.redirect("/tutor/signup");
    }

    // Extract the id properly, assuming it's part of an object (like MongoDB ObjectId)
    const id = response._id ? response._id.toString() : response.toString();

    // Skip image upload and proceed with session management and redirect
    req.session.signedIntutor = true;
    req.session.tutor = response;
    res.redirect("/tutor");

  }).catch((err) => {
    console.log("Error during signup:", err);
    res.status(500).send("Error during signup");
  });

}),


  router.get("/signin", function (req, res) {
    if (req.session.signedIntutor) {
      res.redirect("/tutor");
    } else {
      res.render("tutor/signin", {
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
    return res.render("tutor/signin", {
      admin: false,
      layout: 'admin-empty',
      signInErr: req.session.signInErr,
      email: Email,
      password: Password,

    });
  }

  tutorHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIntutor = true;
      req.session.tutor = response.tutor;
      res.redirect("/tutor");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.render("tutor/signin", {
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
