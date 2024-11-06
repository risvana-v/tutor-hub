var express = require("express");
var userHelper = require("../helper/userHelper");
var tutorHelper = require("../helper/tutorHelper");

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


router.get("/single-product/:id", async function (req, res) {
  let user = req.session.user;
  const productId = req.params.id;

  try {
    const product = await userHelper.getProductById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    const feedbacks = await userHelper.getFeedbackByProductId(productId); // Fetch feedbacks for the specific product

    res.render("users/single-product", {
      admin: false,
      user,
      product,
      feedbacks
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Server Error");
  }
});


router.post("/add-feedback", async function (req, res) {
  let user = req.session.user; // Ensure the user is logged in and the session is set
  let feedbackText = req.body.text; // Get feedback text from form input
  let username = req.body.username; // Get username from form input
  let productId = req.body.productId; // Get product ID from form input
  let tutorId = req.body.tutorId; // Get tutor ID from form input

  if (!user) {
    return res.status(403).send("User not logged in");
  }

  try {
    const feedback = {
      userId: ObjectId(user._id), // Convert user ID to ObjectId
      productId: ObjectId(productId), // Convert product ID to ObjectId
      tutorId: ObjectId(tutorId), // Convert tutor ID to ObjectId
      text: feedbackText,
      username: username,
      createdAt: new Date() // Store the timestamp
    };

    await userHelper.addFeedback(feedback);
    res.redirect("/single-product/" + productId); // Redirect back to the workspace page
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).send("Server Error");
  }
});



router.get("/chat", async function (req, res, next) {
  let user = req.session.user;
  let tutors = await userHelper.getAllTutors();
  console.log("Tutors---------", tutors)
  res.render("users/chat", { admin: false, user, tutors });
});


// router.get("/single-chat/:id", async function (req, res) {
//   let user = req.session.user;
//   const tutorId = req.params.id; // Get tutor ID from URL

//   try {
//     const chats = await userHelper.getChatwithId(tutorId);
//     const tutor = await userHelper.getTutorById(tutorId); // Fetch tutor details

//     res.render("users/single-chat", { admin: false, user, reply, layout: "layout", chats, tutor });
//   } catch (error) {
//     console.error("Error fetching tutor or products:", error);
//     res.status(500).send("Server Error");
//   }
// });

router.get("/single-chat/:id", verifySignedIn, async function (req, res) {
  const user = req.session.user;
  const tutorId = req.params.id; // Get tutor ID from URL

  try {
    const chats = await userHelper.getChatwithId(tutorId); // Fetch chat messages with tutor
    const tutor = await userHelper.getTutorById(tutorId);  // Fetch tutor details

    res.render("users/single-chat", { admin: false, user, layout: "empty", chats, tutor });
  } catch (error) {
    console.error("Error fetching tutor or chats:", error);
    res.status(500).send("Server Error");
  }
});

// Route for adding a chat message
router.post("/add-chat", async (req, res) => {
  let user = req.session.user;
  const tutorId = req.body.tutorId;
  const userId = req.session.user._id;
  const message = req.body.message;
  const userName = req.session.user.Fname; // Get the user's first name from session


  const chatData = {
    tutorId: new ObjectId(tutorId),
    userId: new ObjectId(userId),
    message: message,
    sender: userName, // Mark the sender as user
    timestamp: new Date(),
  };

  try {
    // Insert chat data into the database
    await userHelper.addChat(chatData);

    // Redirect to the chat page with the tutorId
    res.redirect(`/single-chat/${tutorId}`);
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).send('Error sending message');
  }
});


// router.get("/api/chat-messages/:tutorId", async (req, res) => {
//   const tutorId = req.params.tutorId;
//   const userId = req.session.user._id; // User ID from the session

//   try {
//     const chats = await userHelper.getChatMessagesByTutorAndUser(tutorId, userId);
//     res.json(chats); // Send back the chat messages
//   } catch (error) {
//     console.error('Error fetching chat messages:', error);
//     res.status(500).send('Error fetching messages');
//   }
// });

// router.post("/add-chat", function (req, res) {
//   const tutorId = new ObjectId(req.body.tutorId); // Convert tutorId to ObjectId
//   const userId = new ObjectId(req.session.user._id); // Convert userId to ObjectId, assuming it's stored in session

//   const chatData = {
//     ...req.body,
//     tutorId,
//     userId,
//   };

//   userHelper.addChat(chatData, (id) => {
//     res.redirect(`/single-chat/${tutorId}`);
//   });
// });



router.get("/single-tutor/:id", async function (req, res) {
  let user = req.session.user;
  const tutorId = req.params.id; // Get tutor ID from URL

  try {
    const tutor = await userHelper.getTutorById(tutorId); // Fetch tutor details
    const products = await userHelper.getProductsByTutorId(tutorId); // Fetch products by tutor ID

    res.render("users/single-tutor", { admin: false, user, tutor, products });
  } catch (error) {
    console.error("Error fetching tutor or products:", error);
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
    const { Fname, Lname, Email, Phone } = req.body;
    let errors = {};

    // Validation
    if (!Fname || Fname.trim().length === 0) errors.fname = 'Please enter your first name.';
    if (!Lname || Lname.trim().length === 0) errors.lname = 'Please enter your last name.';
    if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) errors.email = 'Please enter a valid email address.';
    if (!Phone) errors.phone = "Please enter your phone number.";
    else if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";

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
        Phone
      });
    }

    // Update user details
    await userHelper.updateUserProfile(req.params.id, req.body);

    // Handle profile picture upload
    if (req.files && req.files.profile) {
      let profileImage = req.files.profile;

      // Specify the path for the profile image based on user ID
      const profileImagePath = `./public/images/user-profile-images/${req.params.id}.png`;

      // Move the uploaded file to the specified path
      await profileImage.mv(profileImagePath);

      // Update the profile image path in the user's database document
      await db.get().collection(collections.USERS_COLLECTION).updateOne(
        { _id: req.params.id },
        { $set: { profileImage: profileImagePath } }
      );
    }

    // Update the session with the latest user profile data
    let updatedUserProfile = await userHelper.getUserDetails(req.params.id);
    req.session.user = updatedUserProfile;

    // Redirect to the profile page after successful update
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
  const { Fname, Lname, Email, Phone, Password, Age } = req.body;
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

  // Validate first name, last name, and email
  if (!Fname) errors.fname = "Please enter your first name.";
  if (!Lname) errors.lname = "Please enter your last name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Age) errors.age = "Please enter your email.";

  // Password validation
  if (!Password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(Password)) {
      errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
  }



  // Check for errors and re-render form if any
  if (Object.keys(errors).length > 0) {
    return res.render("users/signup", {
      admin: false,
      layout: 'admin-empty',
      errors,
      Fname,
      Lname,
      Email,
      Phone,
      Password,
      Age,
    });
  }

  // Proceed with signup
  // Proceed with signup
  userHelper.doSignup(req.body).then((response) => {
    console.log("User response:", response); // Log user response

    // Check if the file is present
    if (req.files && req.files.ProfileImage) {
      let image = req.files.ProfileImage;
      console.log("Received image:", image); // Log the image file

      // Sanitize Fname
      const sanitizedFname = Fname.replace(/[^a-zA-Z0-9]/g, "_");
      const imagePath = `./public/images/user-images/${sanitizedFname}.png`;

      // Move the image
      image.mv(imagePath, (err) => {
        if (err) {
          console.error("Image upload error:", err);
          return res.status(500).send("Image upload failed.");
        }
        req.session.signedIn = true;
        req.session.user = response;
        res.redirect("/");
      });
    } else {
      req.session.signedIn = true;
      req.session.user = response;
      res.redirect("/");
    }
  }).catch((err) => {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred during signup.");
  });
}),


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

  // Convert userId to ObjectId
  const userId = ObjectId(req.body.userId); // Ensure req.body.userId is a valid ObjectId string

  // Get cart products and total amount using the ObjectId
  let products = await userHelper.getCartProductList(userId); // Pass ObjectId to your helper function
  let totalPrice = await userHelper.getTotalAmount(userId); // Pass ObjectId to your helper function

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
    })
    .catch((err) => {
      // Handle any errors
      console.error("Error placing order:", err);
      res.status(500).json({ error: "Failed to place order" });
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
  let cartCount = await userHelper.getCartCount(userId);
  let orders = await userHelper.getUserOrder(userId);

  // Fetch products for each order and attach tutorId
  const ordersWithProducts = await Promise.all(
    orders.map(async (order) => {
      let products = await userHelper.getOrderProducts(order._id);
      return { ...order, products };
    })
  );

  console.log(ordersWithProducts); // Check tutorId here for each product in the order

  res.render("users/orders", {
    admin: false,
    user,
    cartCount,
    orders: ordersWithProducts
  });
});

// View Ordered Products Route
router.get("/view-ordered-products/:id", verifySignedIn, async function (req, res) {
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
});

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




/////////////////////
router.get('/api/chat-messages/:tutorId', async function (req, res) {
  const tutorId = req.params.tutorId;

  try {
    const messages = await userHelper.getChatwithId(tutorId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});


// router.post('/add-chat', async (req, res) => {
//   const { tutorId, message } = req.body;
//   const userId = req.session.user._id;
//   const userName = req.session.user.Fname; // Get the user's first name from session


//   const chatData = {
//     tutorId: new ObjectId(tutorId),
//     userId: new ObjectId(userId),
//     sender: userName, // Assuming user session includes `name`
//     message,
//     timestamp: new Date(),
//   };

//   try {
//     await userHelper.addChat(chatData);
//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error('Error adding chat message:', error);
//     res.status(500).json({ error: 'Could not send message' });
//   }
// });


module.exports = router;
