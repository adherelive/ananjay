import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Validation from "../helpers/Validation/RegisterValidation";
import {toast} from "react-toastify";
import axios from "axios";

export default function CreateAccount() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });
  // Provide initial values to the errors state
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleInput = (event) => {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
    // Clear the error message when the user starts typing again
    setErrors((prev) => ({
      ...prev,
      [event.target.name]: "", // Clear the error message for the current input
    }));
  };

  const handleSubmit = async (event) => {
    
    event.preventDefault();
    console.log(errors);


    if (values.name !== "" && values.email !== "" && values.password !== "") {
      try {
        const res = await axios.post("http://localhost:8082/signup", values);
        if (res.data.isRegistered) {
          toast.success(res.data.message,{autoClose: 1000,position: "bottom-center"});
          navigate("/"); 
        } 
      } catch (error) {
        toast.error(error.message,{autoClose: 1000,position: "bottom-center"});
        console.log(error);
      }
    }
    else{
      setErrors(Validation(values));
    }
  };
  return (
    <>
      <div className="flex justify-center h-screen">
        <div className="flex w-4/12   flex-col justify-center px-6 py-12 lg:px-8  bg-slate-300 shadow-md">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form
              className="space-y-6"
              action="#"
              method="POST"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Name
                </label>
                <div className="mt-2">
                  <input
                    name="name"
                    type="name"
                    onChange={handleInput}
                    className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  {errors.name && (
                    <span className="text-red-800 text-xs">{errors.name}</span>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    name="email"
                    type="email"
                    onChange={handleInput}
                    className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  {errors.email && (
                    <span className="text-red-800 text-xs">{errors.email}</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Password
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    name="password"
                    type="password"
                    onChange={handleInput}
                    className="block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  {errors.password && (
                    <span className="text-red-800 text-xs">
                      {errors.password}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 p-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign in
                </button>
              </div>
            </form>

            <div>
              <p className="mt-5 mb-2 text-center text-sm text-gray-500">
                Already a member?
              </p>
              <Link
                to="/"
                type="button"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 p-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Login in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
