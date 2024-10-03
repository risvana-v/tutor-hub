var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;

module.exports = {

  ///////ADD subject/////////////////////                                         
  addsubject: (subject, tutorId, callback) => {
    if (!tutorId || !objectId.isValid(tutorId)) {
      return callback(null, new Error("Invalid or missing tutorId"));
    }
    console.log(subject);
    subject.Price = parseInt(subject.Price);
    subject.tutorId = objectId(tutorId); // Associate workspace with the builder

    db.get()
      .collection(collections.SUBJECT_COLLECTION)
      .insertOne(subject)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  ///////GET ALL subject/////////////////////                                            
  getAllsubjects: (tutorId) => {
    return new Promise(async (resolve, reject) => {
      let subjects = await db
        .get()
        .collection(collections.SUBJECT_COLLECTION)
        .find({ tutorId: objectId(tutorId) }) // Filter by builderId
        .toArray();
      resolve(subjects);
    });
  },

  ///////ADD subject DETAILS/////////////////////                                            
  getsubjectDetails: (subjectId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.SUBJECT_COLLECTION)
        .findOne({
          _id: objectId(subjectId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE subject/////////////////////                                            
  deletesubject: (subjectId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.SUBJECT_COLLECTION)
        .removeOne({
          _id: objectId(subjectId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE subject/////////////////////                                            
  updatesubject: (subjectId, subjectDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.SUBJECT_COLLECTION)
        .updateOne(
          {
            _id: objectId(subjectId)
          },
          {
            $set: {
              name: subjectDetails.name,
              desc: subjectDetails.desc,
              Price: subjectDetails.Price,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL subject/////////////////////                                            
  deleteAllsubjects: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.SUBJECT_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },


  addProduct: (product, callback) => {
    console.log(product);
    product.Price = parseInt(product.Price);
    db.get()
      .collection(collections.PRODUCTS_COLLECTION)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
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


  doSignup: (tutorData) => {
    return new Promise(async (resolve, reject) => {
      tutorData.Password = await bcrypt.hash(tutorData.Password, 10);
      db.get()
        .collection(collections.TUTOR_COLLECTION)
        .insertOne(tutorData)
        .then((data) => {
          resolve(data.ops[0]);
        });
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
        bcrypt.compare(tutorData.Password, tutor.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.tutor = tutor;
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

  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({ _id: objectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: productDetails.Name,
              Category: productDetails.Category,
              Price: productDetails.Price,
              Description: productDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

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
