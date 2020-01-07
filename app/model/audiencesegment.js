var mongoose = require("mongoose");
var url =
  "mongodb+srv://prudhvi:prudhvi@cluster0-eq1yp.mongodb.net/sito?retryWrites=true";
mongoose.connect(url, { useNewUrlParser: true });

var Schema = mongoose.Schema;
var audiencesegment = new Schema({
  sfid: String,
  name: String,
  cid: String,
  runid: String,
  number_in_job: String,
  errorcode: String,
  error: Number,
  s3inputfile: String,
  s3outputfile: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Audience", audiencesegment);
