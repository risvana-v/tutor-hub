var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;

module.exports = {


  addReply: (reply, callback) => {
    console.log(reply);
    db.get()
      .collection(collections.REPLY_COLLECTION)
      .insertOne(reply)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  getReply: () => {
    return new Promise(async (resolve, reject) => {
      let reply = await db
        .get()
        .collection(collections.REPLY_COLLECTION)
        .find()
        .toArray();
      resolve(reply);
    });
  },


  ///////ADD product/////////////////////                                         
  addproduct: (product, tutorId, callback) => {
    if (!tutorId || !objectId.isValid(tutorId)) {
      return callback(null, new Error("Invalid or missing tutorId"));
    }
    console.log(product);
    product.Price = parseInt(product.Price);
    product.tutorId = objectId(tutorId); // Associate workspace with the tutor

    db.get()
      .collection(collections.PRODUCTS_COLLECTION)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  ///////GET ALL product/////////////////////                                            
  getAllproducts: (tutorId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find({ tutorId: objectId(tutorId) }) // Filter by tutorId
        .toArray();
      resolve(products);
    });
  },

  ///////ADD product DETAILS/////////////////////                                            
  getproductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({
          _id: objectId(productId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE product/////////////////////                                            
  deleteproduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({
          _id: objectId(productId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE product/////////////////////                                            
  updateproduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          {
            _id: objectId(productId)
          },
          {
            $set: {
              name: productDetails.name,
              desc: productDetails.desc,
              Price: productDetails.Price,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL product/////////////////////                                            
  deleteAllproducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },


  // addProduct: (product, callback) => {
  //   console.log(product);
  //   product.Price = parseInt(product.Price);
  //   db.get()
  //     .collection(collections.PRODUCTS_COLLECTION)
  //     .insertOne(product)
  //     .then((data) => {
  //       console.log(data);
  //       callback(data.ops[0]._id);
  //     });
  // },

  // getAllProducts: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let products = await db
  //       .get()
  //       .collection(collections.PRODUCTS_COLLECTION)
  //       .find()
  //       .toArray();
  //     resolve(products);
  //   });
  // },

  getTutorDetails: (tutorId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TUTOR_COLLECTION)
        .findOne({ _id: objectId(tutorId) })
        .then((tutor) => {
          resolve(tutor);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  updateTutorProfile: (tutorId, tutorDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TUTOR_COLLECTION)
        .updateOne(
          { _id: objectId(tutorId) },
          {
            $set: {
              Tutorname: tutorDetails.Tutorname,
              Email: tutorDetails.Email,
              Phone: tutorDetails.Phone,
              Address: tutorDetails.Address,
              City: tutorDetails.City,
              Pincode: tutorDetails.Pincode,
              qualification1: tutorDetails.qualification1,
              qualification2: tutorDetails.qualification2,
              qualification3: tutorDetails.qualification3,


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


  dosignup: (tutorData) => {
    return new Promise(async (resolve, reject) => {
      try {
        tutorData.Password = await bcrypt.hash(tutorData.Password, 10);
        tutorData.approved = false; // Set approved to false initially
        const data = await db.get().collection(collections.TUTOR_COLLECTION).insertOne(tutorData);
        resolve(data.ops[0]);
      } catch (error) {
        reject(error);
      }
    });
  },


  doSignin: (tutorData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let tutor = await db
        .get()
        .collection(collections.TUTOR_COLLECTION)
        .findOne({ Email: tutorData.Email });
      if (tutor) {
        if (tutor.rejected) {
          console.log("User is rejected");
          resolve({ status: "rejected" });
        } else {
          bcrypt.compare(tutorData.Password, tutor.Password).then((status) => {
            if (status) {
              if (tutor.approved) {
                console.log("Login Success");
                response.tutor = tutor;
                response.status = true;
              } else {
                console.log("User not approved");
                response.status = "placed";
              }
              resolve(response);
            } else {
              console.log("Login Failed - Incorrect Password");
              resolve({ status: false });
            }
          });
        }
      } else {
        console.log("Login Failed - Email not found");
        resolve({ status: false });
      }
    });
  },


  doSignin: (tutorData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let tutor = await db
        .get()
        .collection(collections.TUTOR_COLLECTION)
        .findOne({ Email: tutorData.Email });
      if (tutor) {
        if (tutor.rejected) {
          console.log("User is rejected");
          resolve({ status: "rejected" });
        } else {
          bcrypt.compare(tutorData.Password, tutor.Password).then((status) => {
            if (status) {
              if (tutor.approved) {
                console.log("Login Success");
                response.tutor = tutor;
                response.status = true;
              } else {
                console.log("User not approved");
                response.status = "placed";
              }
              resolve(response);
            } else {
              console.log("Login Failed - Incorrect Password");
              resolve({ status: false });
            }
          });
        }
      } else {
        console.log("Login Failed - Email not found");
        resolve({ status: false });
      }
    });
  },
  // getProductDetails: (productId) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collections.PRODUCTS_COLLECTION)
  //       .findOne({ _id: objectId(productId) })
  //       .then((response) => {
  //         resolve(response);
  //       });
  //   });
  // },

  // deleteProduct: (productId) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collections.PRODUCTS_COLLECTION)
  //       .removeOne({ _id: objectId(productId) })
  //       .then((response) => {
  //         console.log(response);
  //         resolve(response);
  //       });
  //   });
  // },

  // updateProduct: (productId, productDetails) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collections.PRODUCTS_COLLECTION)
  //       .updateOne(
  //         { _id: objectId(productId) },
  //         {
  //           $set: {
  //             Name: productDetails.Name,
  //             Category: productDetails.Category,
  //             Price: productDetails.Price,
  //             Description: productDetails.Description,
  //           },
  //         }
  //       )
  //       .then((response) => {
  //         resolve();
  //       });
  //   });
  // },

  // deleteAllProducts: () => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collections.PRODUCTS_COLLECTION)
  //       .remove({})
  //       .then(() => {
  //         resolve();
  //       });
  //   });
  // },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .removeOne({ _id: objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },

  removeAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(orders);
    });
  },

  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "orderObject.status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .removeOne({ _id: objectId(orderId) })
        .then(() => {
          resolve();
        });
    });
  },

  cancelAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .remove({})
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
