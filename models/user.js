'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  User.init({
    name: {
      type:DataTypes.STRING,
      validate:{
        notEmpty : {
          msg: "名前は必ず入力してください。"
        }
      }
    },
    passWord: {
      type:DataTypes.STRING,
      validate:{
        notEmpty : {
          msg: "パスワードは必ず入力してください。"
        }
      }
    },
    mallAddress: {
      type:DataTypes.STRING,
      validate:{
        isEmail : {
          msg: "メールアドレスは必ず入力してください。"
        }
      }
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};