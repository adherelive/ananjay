export default function Validation(values) {
  let error = {};

  const email_pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

  if (values.name === "") {
    error.name = "!!! Name should not be empty";
  } else {
    error.name = "";
  }

  if (values.email === "") {
    error.email = "!!! Email should not be empty";
  } else if (!email_pattern.test(values.email)) {
    error.email = "Please enter a valid email address";
  } else {
    error.email = "";
  }

  if (values.password === "") {
    error.password = "!!! Password should not be empty";
  }
  else if(values.password.length<8){
    error.password="Password must contain at least 8 characters"
  } 
  else if (!password_pattern.test(values.password)) {
    error.password =
      "Password should contain at least one uppercase letter, one lowercase letter, and one digit";
  } else {
    error.password = "";
  }

  return error; // Return the error object after validation
}
