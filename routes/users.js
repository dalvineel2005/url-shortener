const express = require("express");
const { handleUsersSignup, handleUsersLogin, handleUsersLogout } = require("../controller/users");
const router = express.Router();

router.post('/',handleUsersSignup);
router.post('/login',handleUsersLogin);
router.get('/logout', handleUsersLogout);

module.exports = router;