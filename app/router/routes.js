module.exports = function(app) {
  var sito = require("../controller/controller.js");
  app.post("/upload", sito.upload);
  app.post("/deletefile", sito.deletefile);
  app.post("/maincall", sito.maincall);
  app.get("/getrequest", sito.getrequest);
  app.post("/getjobstatus", sito.getjobstatus);
};
