var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");
// const { ObjectId } = require("mongodb"); // Ensure ObjectId is imported


var instance = new Razorpay({
  key_id: "rzp_test_8NokNgt8cA3Hdv",
  key_secret: "xPzG53EXxT8PKr34qT7CTFm9",
});

module.exports = {



  addcontact: (contact, callback) => {
    console.log(contact);
    // contact.user = objectId(contact.user); // Convert userId to ObjectId

    db.get()
      .collection(collections.CONTACT_COLLECTION)
      .insertOne(contact)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  removeChat: (tutorId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHATS_COLLECTION)
        .removeOne({ _id: objectId(tutorId) })
        .then(() => {
          resolve();
        });
    });
  },

  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      if (!objectId.isValid(productId)) {
        reject(new Error('Invalid product ID format'));
        return;
      }

      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((product) => {
          if (!product) {
            reject(new Error('Product not found'));
          } else {
            // Assuming the product has a tutorId field
            resolve(product);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },




  placeOrder: (order, product, total, user) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(order, product, total);
        let status = order["payment-method"] === "COD" ? "placed" : "pending";



        // Create the order object
        let orderObject = {
          deliveryDetails: {
            Fname: order.Fname,
            Lname: order.Lname,
            Email: order.Email,
            Phone: order.Phone,
            Address: order.Address,
            Pincode: order.Pincode,
          },
          userId: objectId(order.userId),
          user: user,
          paymentMethod: order["payment-method"],
          product: product,
          totalAmount: total,
          status: status,
          date: new Date(),
          tutorId: product.tutorId, // Store the tutor's ID
        };

        // Insert the order into the database
        const response = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .insertOne(orderObject);





        resolve(response.ops[0]._id);
      } catch (error) {
        console.error("Error placing order:", error);
        reject(error);
      }
    });
  },



  getFeedbackByProductId: (productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({ productId: objectId(productId) }) // Convert productId to ObjectId
          .toArray();

        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },


  addFeedback: (feedback) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .insertOne(feedback);
        resolve(); // Resolve the promise on success
      } catch (error) {
        reject(error); // Reject the promise on error
      }
    });
  },


  getProductById: (productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const product = await db.get()
          .collection(collections.PRODUCTS_COLLECTION)
          .findOne({ _id: objectId(productId) }); // Convert productId to ObjectId
        resolve(product);
      } catch (error) {
        reject(error);
      }
    });
  },


  getChatWithIdBoth: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Fetching chats with tutorId:", "and userId:", userId);

        const feedbacks = await db.get()
          .collection(collections.CHATS_COLLECTION)
          .find({
            // tutorId: ObjectId(tutorId), // Ensure these match the format in MongoDB
            userId: objectId(userId)
          })
          .toArray();

        console.log("Chats found:", feedbacks);
        resolve(feedbacks);
      } catch (error) {
        console.error("Error fetching chats:", error);
        reject(error);
      }
    });
  },

  // getChatwithId: (tutorId) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const feedbacks = await db.get()
  //         .collection(collections.CHATS_COLLECTION)
  //         .find({ tutorId: objectId(tutorId) }) // Convert productId to ObjectId
  //         .toArray();

  //       resolve(feedbacks);
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // },

  getChatwithId: (tutorId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const messages = await db.get()
          .collection(collections.CHATS_COLLECTION)
          .find({ tutorId: new objectId(tutorId) })
          .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
          .toArray();

        resolve(messages);
      } catch (error) {
        reject(error);
      }
    });
  },





  // addChat: (chat, callback) => {
  //   console.log(chat);
  //   db.get()
  //     .collection(collections.CHATS_COLLECTION)
  //     .insertOne(chat)
  //     .then((data) => {
  //       console.log(data);
  //       callback(data.ops[0]._id);
  //     });
  // },

  getUserById: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await db.get()
          .collection(collections.USERS_COLLECTION)
          .findOne({ _id: objectId(userId) }); // Find user by their ObjectId
        resolve(user);
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        reject(error);
      }
    });
  },

  addChat: (chatData, callback) => {
    db.get()
      .collection(collections.CHATS_COLLECTION)
      .insertOne(chatData)
      .then((data) => {
        callback(data.insertedId);
      })
      .catch((error) => console.error('Error inserting chat message:', error));
  },

  ///////GET ALL product/////////////////////                                            
  getAllproducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getProductsByTutorId: (tutorId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert the tutorId to ObjectId before querying
        let products = await db
          .get()
          .collection(collections.PRODUCTS_COLLECTION)
          .find({ tutorId: objectId(tutorId) }) // Use ObjectId to filter by tutorId
          .toArray();
        resolve(products);
      } catch (error) {
        reject(error); // Handle errors by rejecting the promise
      }
    });
  },

  getAllTutors: () => {
    return new Promise(async (resolve, reject) => {
      let tutors = await db
        .get()
        .collection(collections.TUTOR_COLLECTION)
        .find()
        .toArray();
      resolve(tutors);
    });
  },

  getTutorById: (tutorId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const tutor = await db.get()
          .collection(collections.TUTOR_COLLECTION)
          .findOne({ _id: objectId(tutorId) });
        resolve(tutor);
      } catch (error) {
        reject(error);
      }
    });
  },


  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((user) => {
          resolve(user);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  updateUserProfile: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Fname: userDetails.Fname,
              Lname: userDetails.Lname,
              Email: userDetails.Email,
              Phone: userDetails.Phone,
              Age: userDetails.Age,
              class: userDetails.class,
              // Address: userDetails.Address,
              // District: userDetails.District,
              // Pincode: userDetails.Pincode,
            },
          }
        )
        .then((response) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },


  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collections.USERS_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },

  doSignin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Login Failed");
        resolve({ status: false });
      }
    });
  },

  addToCart: (productId, userId) => {
    console.log(userId);
    let productObject = {
      item: objectId(productId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let productExist = userCart.products.findIndex(
          (products) => products.item == productId
        );
        console.log(productExist);
        if (productExist != -1) {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(productId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: productObject },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObject = {
          user: objectId(userId),
          products: [productObject],
        };
        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObject)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCTS_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      // console.log(cartItems);
      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        var sumQuantity = 0;
        for (let i = 0; i < cart.products.length; i++) {
          sumQuantity += cart.products[i].quantity;
        }
        count = sumQuantity;
      }
      resolve(count);
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  removeCartProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CART_COLLECTION)
        .updateOne(
          { _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } },
          }
        )
        .then(() => {
          resolve({ status: true });
        });
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCTS_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      console.log(total[0].total);
      resolve(total[0].total);
    });
  },

  getCartProductDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartItems = await db
          .get()
          .collection(collections.CART_COLLECTION)
          .aggregate([
            { $match: { userId: objectId(userId) } },
            { $unwind: "$products" },
            {
              $lookup: {
                from: collections.PRODUCTS_COLLECTION,
                localField: "products.item",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            { $unwind: "$productDetails" },
            {
              $project: {
                _id: 0,
                productId: "$productDetails._id",
                name: "$productDetails.name",
                price: "$productDetails.price",
                quantity: "$products.quantity",
                total: { $multiply: ["$products.quantity", "$productDetails.price"] }
              }
            }
          ])
          .toArray();
        resolve(cartItems);
      } catch (error) {
        reject(error);
      }
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
    });
  },

  // placeOrder: (order, products, total, user) => {
  //   return new Promise(async (resolve, reject) => {
  //     console.log(order, products, total);
  //     let status = order["payment-method"] === "COD" ? "placed" : "pending";
  //     let orderObject = {
  //       deliveryDetails: {
  //         name: order.name,
  //         email: order.email,
  //         mobile: order.mobile,
  //       },
  //       userId: objectId(order.userId),
  //       user: user,
  //       paymentMethod: order["payment-method"],
  //       products: products,
  //       totalAmount: total,
  //       status: status,
  //       date: new Date(),
  //     };
  //     db.get()
  //       .collection(collections.ORDER_COLLECTION)
  //       .insertOne({ orderObject })
  //       .then((response) => {
  //         db.get()
  //           .collection(collections.CART_COLLECTION)
  //           .removeOne({ user: objectId(order.userId) });
  //         resolve(response.ops[0]._id);
  //       });
  //   });
  // },

  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ userId: objectId(userId) }) // Use 'userId' directly, not inside 'orderObject'
          .sort({ "date": -1 }) // Sort by nested date field in descending order
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Helper Function to Get Order Products Including tutorId
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let products = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .aggregate([
            {
              $match: { _id: objectId(orderId) }, // Match the order by its ID
            },
            {
              $project: {
                // Include product, user, and other relevant fields
                product: 1,
                user: 1,
                paymentMethod: 1,
                totalAmount: 1,
                status: 1,
                date: 1,
                deliveryDetails: 1, // Add deliveryDetails to the projection

              },
            },
          ])
          .toArray();

        resolve(products[0]); // Fetch the first (and likely only) order matching this ID
      } catch (error) {
        reject(error);
      }
    });
  },


  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("New Order : ", order);
        resolve(order);
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "xPzG53EXxT8PKr34qT7CTFm9");

      hmac.update(
        details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "orderObject.status": "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .removeOne({ _id: objectId(orderId) })
        .then(() => {
          resolve();
        });
    });
  },

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.PRODUCTS_COLLECTION)
            .find({
              $text: {
                $search: details.search,
              },
            })
            .toArray();
          resolve(result);
        })

    });
  },
};
