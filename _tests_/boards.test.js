const app = require("../index.js");
const supertest = require("supertest");
const request = supertest(app);
const mongoose = require("mongoose");
const Board = require("../models/Board");

let token;
