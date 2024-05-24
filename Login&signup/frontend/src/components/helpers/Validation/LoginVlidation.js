export default function Validation(values) {
    let error = {};
  
    const email_pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
  
    if (values.email === "") {
      error.email = "!!! Email field should not be empty";
    } else if (!email_pattern.test(values.email)) {
      error.email = "Please enter a valid email address";
    } else {
      error.email = "";
    }
  
    if (values.password === "") {
      error.password = "!!! Password field should not be empty";
    } else if (!password_pattern.test(values.password)) {
      error.password = "!!! Wrong password try again";
    } else {
      error.password = "";
    }
  
    return error; // Return the error object after validation
  }