import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  CreateUser,
} from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

export const register = async(requestAnimationFrame, res)=>{
  try{
    const {name, email, password}= requestAnimationFrame.body;
    const existingUser = await findUserByEmail(email);

    if(existingUser){
      return res.status(400).json({
        message:"User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await CreateUser({
      name,
      email,
      password:hashedPassword,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken=generateRefreshToken(newUser);

    res.status(201).json({
      user:{
        id:newUser.id,
        name:newUser.name,
        email:newUser.email,
      },
      accessToken,
      refreshToken,
    });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};