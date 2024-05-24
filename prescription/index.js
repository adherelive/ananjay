import express from "express";
import Authenticated from "../middleware/auth";
import PatientController from "../../../app/controllers/patients/patients.controller";
import multer from "multer";

import userService from "../../../app/services/user/user.service";
import patientService from "../../../app/services/patients/patients.service";
import carePlanService from "../../../app/services/carePlan/carePlan.service";
import medicineService from "../../../app/services/medicine/medicine.service";
import appointmentService from "../../../app/services/appointment/appointment.service";
import medicationReminderService from "../../../app/services/medicationReminder/mReminder.service";
import conditionService from "../../../app/services/condition/condition.service";
import qualificationService from "../../../app/services/doctorQualifications/doctorQualification.service";
import doctorRegistrationService from "../../../app/services/doctorRegistration/doctorRegistration.service";
import userRolesService from "../../../app/services/userRoles/userRoles.service";
import DietService from "../../../app/services/diet/diet.service";
import PortionServiceService from "../../../app/services/portions/portions.service";
import RepetitionService from "../../../app/services/exerciseRepetitions/repetition.service";
import WorkoutService from "../../../app/services/workouts/workout.service";
import userPreferenceService from "../../../app/services/userPreferences/userPreference.service";


import ExerciseContentWrapper from "../../../app/ApiWrapper/web/exerciseContents";
import UserRolesWrapper from "../../../app/ApiWrapper/web/userRoles";
import VitalWrapper from "../../../app/ApiWrapper/web/vitals";
import UserWrapper from "../../../app/ApiWrapper/web/user";
import CarePlanWrapper from "../../../app/ApiWrapper/web/carePlan";
import AppointmentWrapper from "../../../app/ApiWrapper/web/appointments";
import MReminderWrapper from "../../../app/ApiWrapper/web/medicationReminder";
import MedicineApiWrapper from "../../../app/ApiWrapper/mobile/medicine";
import SymptomWrapper from "../../../app/ApiWrapper/web/symptoms";
import DoctorWrapper from "../../../app/ApiWrapper/web/doctor";
import ConsentWrapper from "../../../app/ApiWrapper/web/consent";
import PatientWrapper from "../../../app/ApiWrapper/web/patient";
import ReportWrapper from "../../../app/ApiWrapper/web/reports";
import ConditionWrapper from "../../../app/ApiWrapper/web/conditions";
import QualificationWrapper from "../../../app/ApiWrapper/web/doctorQualification";
import RegistrationWrapper from "../../../app/ApiWrapper/web/doctorRegistration";
import DegreeWrapper from "../../../app/ApiWrapper/web/degree";
import CouncilWrapper from "../../../app/ApiWrapper/web/council";
import TreatmentWrapper from "../../../app/ApiWrapper/web/treatments";
import DoctorPatientWatchlistWrapper from "../../../app/ApiWrapper/web/doctorPatientWatchlist";
import DietWrapper from "../../../app/ApiWrapper/web/diet";
import ProviderWrapper from "../../../app/ApiWrapper/web/provider";
import PortionWrapper from "../../../app/ApiWrapper/web/portions";
import WorkoutWrapper from "../../../app/ApiWrapper/web/workouts";
import UserPreferenceWrapper from "../../../app/ApiWrapper/web/userPreference";
import * as DietHelper from "../../../app/controllers/diet/dietHelper"
import moment from "moment";

import {
    BODY_VIEW,
    CONSENT_TYPE,
    EMAIL_TEMPLATE_NAME,
    USER_CATEGORY,
    S3_DOWNLOAD_FOLDER,
    PRESCRIPTION_PDF_FOLDER,
    DIAGNOSIS_TYPE,
    S3_DOWNLOAD_FOLDER_PROVIDER,
    ONBOARDING_STATUS,
    SIGN_IN_CATEGORY, DOSE_UNIT,
    PATIENT_MEAL_TIMINGS,
    APPOINTMENT_TYPE,
    MEDICATION_TIMING,
    WHEN_TO_TAKE_ABBREVATIONS,
    categories,
} from "../../../constant";

import { downloadFileFromS3 } from "../../../app/controllers/user/userHelper";

import { getFilePath } from "../../../app/helper/filePath";
import { checkAndCreateDirectory } from "../../../app/helper/common";

import { getDoctorCurrentTime } from "../../../app/helper/getUserTime";
import diet from "../../../app/ApiWrapper/web/diet";

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

var storage = multer.memoryStorage();
var upload = multer({ dest: "../app/public/", storage: storage });
const dataBinding = {
    items: [
        {
            name: "item 1",
            price: 100,
        },
        {
            name: "item 2",
            price: 200,
        },
        {
            name: "item 3",
            price: 300,
        },
    ],
    total: 600,
    isWatermark: true,
};
const getWhenToTakeText = (number) => {
    switch (number) {
        case 1:
            return `Once a day`;
        case 2:
            return `Twice a day`;
        case 3:
            return `Thrice a day`;
        default:
            return "";
    }
}

async function html_to_pdf({ templateHtml, dataBinding, options }) {
    handlebars.registerHelper('print', function (value) {
        return ++value
    });
    const template = handlebars.compile(templateHtml);
    const finalHtml = encodeURIComponent(template(dataBinding));

    const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
        waitUntil: "networkidle0",
    });

    let pdfBuffer = await page.pdf(options); // based on = pdf(options?: PDFOptions): Promise<Buffer>; from https://pptr.dev/api/puppeteer.page.pdf pdfBuffer will stored the PDF file Buffer content when "path is not provoded" 
    await browser.close();
    return pdfBuffer; // Returning the value when page.pdf promise gets resolved
};

const router = express.Router();

router.get(
    "/:care_plan_id",
    // Authenticated,
    // PatientController.generatePrescription,
    async (req, res) => {
        try {
            console.log(path.join("./routes/api/prescription/prescription.html"))
            console.log("./prescription.html")
            const templateHtml = fs.readFileSync(
                path.join("./routes/api/prescription/prescription.html"),
                "utf8"
            );
            console.log(path.join(process.cwd(), "prescription.html"))
            const options = {
                format: "A4",
                headerTemplate: "<p></p>",
                footerTemplate: "<p></p>",
                displayHeaderFooter: false,
                margin: {
                    top: "40px",
                    bottom: "100px",
                },
                printBackground: true,
                path: "invoice.pdf",
            };
            let pdf_buffer_vaule = await html_to_pdf({ templateHtml, dataBinding, options });
            res.contentType("application/pdf");
            return res.send(pdf_buffer_vaule);
        } catch (err) {
            console.log(err)
            console.log("care_plan_id", req.params.care_plan_id);
        }
    }
);

// formatting doctor data 
function formatDoctorsData(
    doctors,
    users,
    degrees,
    registrations,
    providers = {},
    doctor_id
) {
    // const doctorsIds = Object.keys(doctors);
    let degree = "";
    let registrationNumber = "";

    const doctorId = doctor_id;

    const {
        [doctorId]: {
            basic_info: {
                user_id = null,
                first_name = "",
                middle_name = "",
                last_name = "",
                signature_image = "",
                profile_pic,
            } = {},
            city = "",
            provider_id,
        } = {},
    } = doctors;

    const {
        [user_id]: {
            basic_info: { mobile_number = "", email = "", prefix = "" } = {},
        } = {},
    } = users;

    let providerLogo = "";
    let providerName = "";
    let providerAddress = "";

    let mobileNumber = mobile_number;
    let prefixToShow = prefix;

    console.log("========provider details start==================")
    console.log(providers)
    console.log("========provider details end====================")

    if (Object.keys(providers).length > 0) {
        const {
            basic_info: { user_id: providerUserId, name, address } = {},
            details: { icon: providerIcon } = {},
        } = providers || {};
        providerName = name;
        providerAddress = address;
        providerLogo = providerIcon;

        const { basic_info: { mobile_number, prefix } = {} } =
            users[providerUserId] || {};
        mobileNumber = mobile_number;
        prefixToShow = prefix;
    }

    let name = first_name;
    name = middle_name ? `${name} ${middle_name}` : name;
    name = last_name ? `${name} ${last_name}` : name;

    const degreeIds = Object.keys(degrees);
    for (const id of degreeIds) {
        const { [id]: { basic_info: { name: degreeName = "" } = {} } = {} } =
            degrees;
        degree = degreeName ? degree + `${degreeName}, ` : degree;
    }

    const registrationIds = Object.keys(registrations);
    for (const regId of registrationIds) {
        const {
            [regId]: {
                number = "",
                council: { basic_info: { name: council_name = "" } = {} } = {},
            } = {},
        } = registrations;
        registrationNumber = registrationNumber + `${number}, `;
    }

    if (degree) {
        degree = degree.substring(0, degree.length - 2);
    }

    if (registrationNumber) {
        registrationNumber = registrationNumber.substring(
            0,
            registrationNumber.length - 2
        );
    }

    return {
        name,
        email,
        mobile_number: mobileNumber,
        city,
        degree,
        registrationNumber,
        signature_image,
        prefix: prefixToShow,
        providerLogo,
        providerName,
        providerAddress,
    };
}

// formatting patients data
function formatPatientData(patients, users) {
    const patientIds = Object.keys(patients);

    const patientId = patientIds[0];
    console.log(JSON.stringify({ patients, users }))
    const {
        [patientId]: {
            basic_info: {
                gender = "",
                age = "",
                first_name = "",
                middle_name = "",
                last_name = "",
                address = "",
                height = "",
                weight = "",
                user_id = null,
                full_name = "",
                uid = "",
            } = {},
            details: { allergies = "", comorbidities = "" } = {},
            created_at = ""
        } = {},
    } = patients;

    let name = first_name;
    name = middle_name ? `${name} ${middle_name}` : name;
    name = last_name ? `${name} ${last_name}` : name;

    const {
        [user_id]: { basic_info: { mobile_number = "", prefix = "" } = {} } = {},
    } = users;

    return {
        name,
        age,
        gender,
        address,
        height,
        weight,
        allergies,
        comorbidities,
        mobile_number,
        prefix,
        uid, created_at: `${moment(new Date(created_at)).tz("Asia/Kolkata").format("DD MMM 'YY, hh:mm A")}`
    };
}

// formate care plan data

function formatCarePlanData(carePlans, conditions) {
    let condition = "",
        diagnosis = "",
        symptoms = "",
        clinicalNotes = "",
        carePlanId = null;
    const conditionIds = Object.keys(conditions);
    if (conditionIds && conditionIds.length) {
        const conditionId = conditionIds[0];
        const { [conditionId]: { basic_info: { name = "" } = {} } = {} } =
            conditions;
        condition = name;
    }

    const carePlanIds = Object.keys(carePlans);
    if (carePlanIds && carePlanIds.length) {
        carePlanId = carePlanIds[0];
        const {
            [carePlanId]: {
                details: {
                    symptoms: symptom = "",
                    diagnosis: { description = "" } = {},
                    clinical_notes = "",
                } = {},
            },
        } = carePlans;

        diagnosis = description;
        symptoms = symptom ? symptom : "";
        clinicalNotes = clinical_notes;
    }

    return { condition, diagnosis, symptoms, clinicalNotes, carePlanId };
}

function renderChiefComplaints({ symptoms }) {
    try {
        let finalSymptom = "";

        if (
            symptoms === undefined ||
            symptoms === null ||
            (typeof symptoms === "object" && Object.keys(symptoms).length === 0) ||
            (typeof symptoms === "string" && symptoms.trim().length === 0)
        ) {
            finalSymptom = "";
        } else {
            finalSymptom = symptoms;
        }

        return finalSymptom;
    } catch (err) {
        console.log("error in chief complience", err);
    }
}


function formatMedicationsData(medications, medicines) {
    // have to send the list of objects containing instruction medicine name, medicine type, strength, frequency, duration,
    let medicationsList = [];

    const medicationIds = Object.keys(medications);
    let date = null;
    for (const medicationId of medicationIds) {
        let medicationDataObj = {};
        const {
            [medicationId]: {
                basic_info: {
                    start_date = "",
                    end_date = "",
                    description = "",
                    details = null,
                    updated_at,
                } = {},
                details: mobileDetails = null,
                organizer,
            },
        } = medications;
        let repeat_days = medications[medicationId].basic_info.details.repeat_days;
        let mainDetails = {};

        if (mobileDetails) {
            mainDetails = { ...mobileDetails };
        } else {
            mainDetails = { ...details };
        }

        const {
            medicine_id = null,
            when_to_take = [],
            medicine_type = "",
            strength = "",
            unit = "",
            quantity = null,
            description: detailDescription = ""
        } = mainDetails || {};

        const {
            [medicine_id]: {
                basic_info: { name = "", type = "" } = {},
                details: medicineExtraDetails = {},
            } = {},
        } = medicines || {};
        const { generic_name = "" } = medicineExtraDetails || {};

        const startDateObj = moment(start_date);

        // const duration = endDateObj.diff(startDateObj, "days");

        const startDate = `${startDateObj.format("LL")}`;
        let endDate = "";

        if (end_date) {
            const endDateObj = moment(end_date);
            // Gaurav New Changes - start
            endDate = end_date;
            // Gaurav New Changes - End
            // endDate = `${endDateObj.get("year")}/${endDateObj.get(
            //   "month"
            // )}/${endDateObj.get("date")}`;
        }

        const { [unit]: { text = "" } = {} } = DOSE_UNIT;
        const unitToShow = text ? text : unit;
        let newVar = unit === "3" ? "One" : strength

        medicationDataObj = {
            description: description || detailDescription,
            medicineName: name ? name.toUpperCase() : name,
            genericName: generic_name,
            medicineType: categories.items.find((x) => x.id == medicine_type).name,
            // strength,
            strength: `${`${strength} ${unitToShow.toUpperCase()}`}`,
            quantity,
            organizer,
            frequency: getWhenToTakeText(when_to_take.length),
            startDate,
            endDate,
            timings: getWhenToTakeTimings(when_to_take),
            timings_new: getWhenToTakeTimingsNew(when_to_take),
            dosage: getWhenToTakeDosage(when_to_take),
            duration: end_date
                ? moment(end_date).diff(moment(start_date), "days") + 1
                : "Long term", // todo: change text here after discussion
            repeat_days,
            unit: unitToShow === "3" ? "One" : `${`${strength} ${unitToShow.toUpperCase()}`}`,  //unitToShow.toUpperCase(),

            isSOS: getWhenToTakeTimings(when_to_take) == ""
        };

        medicationsList.push(medicationDataObj);
    }

    return medicationsList;
}

const getWhenToTakeTimingsNew = (when_to_take = []) => {
    let morning = []
    let afternoon = []
    let night = []

    for (let i in when_to_take) {
        if (["0", "1", "2", "3"].includes(when_to_take[i])) morning.push(MEDICATION_TIMING[when_to_take[i]].text)
        if (["4", "5", "6", "7", "8"].includes(when_to_take[i])) afternoon.push(MEDICATION_TIMING[when_to_take[i]].text)
        if (["9", "10", "11", "12"].includes(when_to_take[i])) night.push(MEDICATION_TIMING[when_to_take[i]].text)
    }
    return { morning, afternoon, night }
};

const getWhenToTakeTimings = (when_to_take = []) => {
    return when_to_take.map((id) => MEDICATION_TIMING[id].text).join(", ");
};

const getWhenToTakeDosage = (when_to_take) => {
    switch (when_to_take.length) {
        case WHEN_TO_TAKE_ABBREVATIONS.OD:
            return "Once a day";
        case WHEN_TO_TAKE_ABBREVATIONS.BD:
            return "Twice a day";
        case WHEN_TO_TAKE_ABBREVATIONS.TDS:
            return "Thrice a day";
        case WHEN_TO_TAKE_ABBREVATIONS.SOS:
            return "Whenever required";
        default:
            return null;
    }
};

function getLatestUpdateDate(medications) {
    const medicationIds = Object.keys(medications);
    let date = null;
    let isPrescriptionUpdated = false;
    for (const medicationId of medicationIds) {
        const {
            [medicationId]: {
                basic_info: { updated_at } = {},
                details: mobileDetails = null,
            },
        } = medications;
        let newdate = new Date(updated_at);

        if (date == null) {
            date = newdate;
        } else if (newdate > date) {
            date = newdate;
            isPrescriptionUpdated = true;
        }
    }
    return { date, isPrescriptionUpdated };
}

router.get(
    "/detailss/:care_plan_id",
    Authenticated,
    async (req, res) => {
        try {
            const { care_plan_id = null } = req.params;
            const {
                userDetails: {
                    userId,
                    userRoleId = null,
                    userData: { category } = {},
                } = {},
                permissions = [],
            } = req;

            const dietService = new DietService();
            const workoutService = new WorkoutService();
            // const carePlanId = parseInt(care_plan_id);
            let doctor_id = "";
            let dataForPdf = {};

            let usersData = {};
            let userRolesData = {};
            let qualifications = {};
            let degrees = {};
            let registrationsData = {};
            let conditions = {};
            let medications = {};
            let medicines = {};
            let medicinesArray = [];
            let nextAppointmentDuration = null;
            if (!care_plan_id) {
                return raiseClientError(res, 422, {}, "Invalid Care Plan.");
            }
            const carePlan = await carePlanService.getCarePlanById(care_plan_id);
            const carePlanData = await CarePlanWrapper(carePlan);
            const { clinical_notes, follow_up_advise } =
                (await carePlanData.getCarePlanDetails()) || {};

            const curr_patient_id = carePlanData.getPatientId();
            const doctorUserRoleId = carePlanData.getUserRoleId();
            const userRoles = await userRolesService.getSingleUserRoleByData({
                id: doctorUserRoleId,
            });
            if (userRoles) {
                const userRolesWrapper = await UserRolesWrapper(userRoles);
                userRolesData = {
                    ...userRolesData,
                    [doctorUserRoleId]: userRolesWrapper.getBasicInfo(),
                };
            }
            const carePlanCreatedDate = carePlanData.getCreatedAt();
            const {
                details: { condition_id = null } = {},
                medication_ids = [],
                appointment_ids = [],
                diet_ids = [],
                workout_ids = [],
            } = await carePlanData.getAllInfo();

            const conditionData = await conditionService.getByData({
                id: condition_id,
            });

            if (conditionData) {
                const condition = await ConditionWrapper(conditionData);
                conditions[condition_id] = condition.getBasicInfo();
            }

            for (const medicationId of medication_ids) {
                const medication = await medicationReminderService.getMedication({
                    id: medicationId,
                });

                if (medication) {
                    const medicationWrapper = await MReminderWrapper(medication);
                    const medicineId = medicationWrapper.getMedicineId();
                    const medicineData = await medicineService.getMedicineByData({
                        id: medicineId,
                    });

                    for (const medicine of medicineData) {
                        const medicineWrapper = await MedicineApiWrapper(medicine);
                        medicines = {
                            ...medicines,
                            ...{
                                [medicineWrapper.getMedicineId()]: medicineWrapper.getAllInfo(),
                            },
                        };
                    }

                    let mediactionNewData = await medicationWrapper.getBasicInfo();

                    medications = {
                        ...medications,
                        ...{ [medicationId]: await medicationWrapper.getBasicInfo() },
                    };
                    medicinesArray.push(await medicationWrapper.getBasicInfo());
                }
            }
            // }

            const now = moment();
            let nextAppointment = null;

            let suggestedInvestigations = [];
            for (const appointmentId of appointment_ids) {
                const appointment = await appointmentService.getAppointmentById(
                    appointmentId
                );

                if (appointment) {
                    const appointmentWrapper = await AppointmentWrapper(appointment);

                    const startDate = appointmentWrapper.getStartTime();
                    const startDateObj = moment(startDate);
                    const { organizer, provider_id } =
                        await appointmentWrapper.getBasicInfo();
                    const diff = startDateObj.diff(now);

                    if (diff > 0) {
                        if (!nextAppointment || nextAppointment.diff(startDateObj) > 0) {
                            nextAppointment = startDateObj;
                        }
                    }

                    const { type } = appointmentWrapper.getDetails() || {};

                    // if (type !== CONSULTATION) {
                    const {
                        type_description = "",
                        radiology_type = "",
                        description = "",
                        reason = ""
                    } = appointmentWrapper.getDetails() || {};
                    suggestedInvestigations.push({
                        type,
                        description,
                        type_description,
                        radiology_type,
                        provider_id,
                        start_date: `${moment(new Date(startDate)).format("DD MMM 'YY")}`,
                        organizer,
                        reason
                    });
                    // }
                }
            }

            let dietApiData = {},
                dietIds = [],
                workoutApiData = {},
                workoutIds = [],
                dietList = [],
                workoutlist = [];

            // diet
            for (const id of diet_ids) {
                const diet = await dietService.getByData({ id });

                if (diet) {
                    const dietData = await dietService.findOne({ id });
                    const dietWrapper = await DietWrapper({ data: dietData });
                    const expired_on = await dietWrapper.getExpiredOn();
                    if (expired_on) {
                        continue;
                    }
                    dietList.push(dietWrapper)

                    const referenceInfo = await dietWrapper.getReferenceInfo();

                    let dietFoodGroupsApidata = {},
                        dietBasicInfo = {};

                    dietBasicInfo[dietWrapper.getId()] = await dietWrapper.getBasicInfo();

                    const {
                        diet_food_group_mappings = {},
                        food_groups = {},
                        food_items = {},
                        food_item_details = {},
                    } = referenceInfo || {};

                    const timeWise = await DietHelper.getTimeWiseDietFoodGroupMappings({
                        diet_food_group_mappings,
                    });

                    for (let eachTime in timeWise) {
                        const { mappingIds = [] } = timeWise[eachTime] || {};

                        for (let ele of mappingIds) {
                            let primary = null,
                                related_diet_food_group_mapping_ids = [];

                            if (Array.isArray(ele)) {
                                ele.sort(function (a, b) {
                                    return a - b;
                                });

                                primary = ele[0] || null;
                                related_diet_food_group_mapping_ids = ele.slice(1);
                            } else {
                                primary = ele;
                            }

                            let currentfodmattedData = {};

                            // const related_diet_food_group_mapping_ids = mappingIds.slice(1);
                            let similarFoodGroups = [],
                                notes = "";

                            const current_mapping = diet_food_group_mappings[primary] || {};
                            const { basic_info: { time = "", food_group_id = null } = {} } =
                                current_mapping;
                            const {
                                basic_info: { food_item_detail_id = null, serving = null } = {},
                                details = {},
                            } = food_groups[food_group_id] || {};
                            const { basic_info: { portion_id = null } = {} } =
                                food_item_details[food_item_detail_id] || {};

                            if (details) {
                                const { notes: detail_notes = "" } = details;
                                notes = detail_notes;
                            }
                            if (related_diet_food_group_mapping_ids.length) {
                                for (
                                    let i = 0;
                                    i < related_diet_food_group_mapping_ids.length;
                                    i++
                                ) {
                                    const similarMappingId =
                                        related_diet_food_group_mapping_ids[i];

                                    const {
                                        basic_info: {
                                            food_group_id: similar_food_group_id = null,
                                        } = {},
                                    } = diet_food_group_mappings[similarMappingId] || {};
                                    const {
                                        basic_info: {
                                            food_item_detail_id: similar_food_item_detail_id = null,
                                            serving: similar_serving = null,
                                        } = {},
                                        details: similar_details = {},
                                    } = food_groups[similar_food_group_id] || {};

                                    const {
                                        basic_info: { portion_id: similar_portion_id = null } = {},
                                    } = food_item_details[similar_food_item_detail_id] || {};

                                    let similar_notes = "";
                                    if (similar_details) {
                                        const { notes = "" } = similar_details || {};
                                        similar_notes = notes;
                                    }

                                    const similarData = {
                                        serving: similar_serving,
                                        portion_id: similar_portion_id,
                                        food_item_detail_id: similar_food_item_detail_id,
                                        food_group_id: similar_food_group_id,
                                        notes: similar_notes,
                                    };

                                    similarFoodGroups.push(similarData);
                                    // delete diet_food_group_mappings[similarMappingId];
                                }
                            }

                            currentfodmattedData = {
                                serving,
                                portion_id,
                                food_group_id,
                                notes,
                                food_item_detail_id,
                                similar: [...similarFoodGroups],
                            };

                            const currentDietDataForTime = dietFoodGroupsApidata[time] || [];
                            currentDietDataForTime.push(currentfodmattedData);

                            dietFoodGroupsApidata[`${time}`] = [...currentDietDataForTime];
                            // dietFoodGroupsApidata["food_details_gaurav"] = food_item_details[dietFoodGroupsApidata["food_item_detail_id"]]
                        }
                    }
                    let diet_food_groups = {
                        ...dietFoodGroupsApidata,

                    };

                    let this_dite_data = {
                        diets: {
                            ...dietBasicInfo,
                        },
                        diet_food_groups,
                        food_items,
                        food_item_details,
                    };

                    dietList.push(this_dite_data)
                    dietApiData[id] = this_dite_data;
                    dietIds.push(id);
                }
            }


            console.log("=========================")
            console.log(JSON.stringify(dietList))
            console.log({ dietIds })
            console.log("=========================")

            for (const id of workout_ids) {
                const workout = await workoutService.findOne({ id });

                if (workout) {
                    const workoutWrapper = await WorkoutWrapper({ data: workout });
                    const expired_on = await workoutWrapper.getExpiredOn();
                    if (expired_on) {
                        continue;
                    }

                    let workout_exercise_groups = [];
                    const { exercises, exercise_groups, exercise_details } =
                        await workoutWrapper.getReferenceInfo();

                    for (const exerciseGroupId of Object.keys(exercise_groups)) {
                        const {
                            basic_info: { id: exercise_group_id, exercise_detail_id } = {},
                            sets,
                            details = {},
                        } = exercise_groups[exerciseGroupId] || {};

                        const { basic_info: { exercise_id } = {} } =
                            exercise_details[exercise_detail_id] || {};

                        workout_exercise_groups.push({
                            exercise_group_id,
                            exercise_detail_id,
                            sets,
                            ...details,
                        });
                    }
                    let this_workout_data = {
                        ...(await workoutWrapper.getReferenceInfo()),
                        workout_exercise_groups,
                    };
                    workoutlist.push(this_workout_data)
                    workoutApiData[workoutWrapper.getId()] = this_workout_data

                    workoutIds.push(workoutWrapper.getId());
                }
            }

            const sortedInvestigations = suggestedInvestigations.sort((a, b) => {
                const { start_date: aStartDate } = a || {};
                const { start_date: bStartDate } = b || {};
                if (moment(bStartDate).diff(moment(aStartDate), "minutes") > 0) {
                    return 1;
                } else {
                    return -1;
                }
            });

            if (nextAppointment) {
                nextAppointmentDuration =
                    nextAppointment.diff(now, "days") !== 0
                        ? `${nextAppointment.diff(now, "days")} days`
                        : `${nextAppointment.diff(now, "hours")} hours`;
            }

            let patient = null;

            if (category === USER_CATEGORY.DOCTOR) {
                patient = await patientService.getPatientById({ id: curr_patient_id });
                doctor_id = req.userDetails.userCategoryData.basic_info.id;
            } else if (category === USER_CATEGORY.HSP) {
                patient = await patientService.getPatientById({ id: curr_patient_id });
                ({ doctor_id } = await carePlanData.getReferenceInfo());
            } else {
                patient = await patientService.getPatientByUserId(userId);
                ({ doctor_id } = await carePlanData.getReferenceInfo());
            }

            const patientData = await PatientWrapper(patient);

            const timingPreference = await userPreferenceService.getPreferenceByData({
                user_id: patientData.getUserId(),
            });
            const userPrefOptions = await UserPreferenceWrapper(timingPreference);
            const { timings: userTimings = {} } = userPrefOptions.getAllDetails();
            const timings = DietHelper.getTimings(userTimings);

            // const { doctors, doctor_id } = await carePlanData.getReferenceInfo();
            const { doctors } = await carePlanData.getReferenceInfo();

            const {
                [doctor_id]: {
                    basic_info: { signature_pic = "", full_name = "", profile_pic } = {},
                } = {},
            } = doctors;

            checkAndCreateDirectory(S3_DOWNLOAD_FOLDER);

            const doctorSignImage = `${S3_DOWNLOAD_FOLDER}/${full_name}.jpeg`;

            const downloadImage = await downloadFileFromS3(
                getFilePath(signature_pic),
                doctorSignImage
            );

            const doctorQualifications =
                await qualificationService.getQualificationsByDoctorId(doctor_id);

            await doctorQualifications.forEach(async (doctorQualification) => {
                const doctorQualificationWrapper = await QualificationWrapper(
                    doctorQualification
                );
                const degreeId = doctorQualificationWrapper.getDegreeId();
                const degreeWrapper = await DegreeWrapper(null, degreeId);
                degrees[degreeId] = degreeWrapper.getBasicInfo();
            });

            const doctorRegistrations =
                await doctorRegistrationService.getRegistrationByDoctorId(doctor_id);

            for (const doctorRegistration of doctorRegistrations) {
                const registrationData = await RegistrationWrapper(doctorRegistration);
                const council_id = registrationData.getCouncilId();
                const councilWrapper = await CouncilWrapper(null, council_id);

                const regData = registrationData.getBasicInfo();
                const { basic_info: { number = "" } = {} } = regData;
                registrationsData[registrationData.getDoctorRegistrationId()] = {
                    number,
                    council: councilWrapper.getBasicInfo(),
                };
            }

            const {
                [`${doctor_id}`]: { basic_info: { user_id: doctorUserId = null } = {} },
            } = doctors;

            let user_ids = [doctorUserId, userId];
            if (category === USER_CATEGORY.DOCTOR || category === USER_CATEGORY.HSP) {
                const curr_data = await patientData.getAllInfo();
                const { basic_info: { user_id: curr_p_user_id = "" } = {} } =
                    curr_data || {};
                user_ids = [doctorUserId, curr_p_user_id];
            }

            for (const id of user_ids) {
                const intId = parseInt(id);
                const user = await userService.getUserById(intId);

                if (user) {
                    const userWrapper = await UserWrapper(user.get());
                    usersData = { ...usersData, ...{ [id]: userWrapper.getBasicInfo() } };
                }
            }

            // provider data
            const {
                [doctorUserRoleId]: {
                    basic_info: { linked_id: provider_id = null } = {},
                } = {},
            } = userRolesData || {};

            let providerData = {};

            let providerIcon = "";
            let providerPrescriptionDetails = "";
            if (provider_id) {
                const providerWrapper = await ProviderWrapper(null, provider_id);
                const { providers, users } = await providerWrapper.getReferenceInfo();

                const { details: { icon = null, prescription_details = "" } = {} } =
                    providers[provider_id] || {};
                checkAndCreateDirectory(S3_DOWNLOAD_FOLDER_PROVIDER);
                providerPrescriptionDetails = prescription_details;
                if (icon) {
                    providerIcon = `${S3_DOWNLOAD_FOLDER_PROVIDER}/provider-${provider_id}-icon.jpeg`;

                    const downloadProviderImage = await downloadFileFromS3(
                        getFilePath(icon),
                        providerIcon
                    );
                }
                console.log("provide details start ====================1 ")
                providerData = { ...providers[provider_id] };
                console.log({providerData})
                console.log("provide details end ====================1 ")
                usersData = { ...usersData, ...users };
            }

            const portionServiceService = new PortionServiceService();
            const allPortions = await portionServiceService.getAll();
            let portionApiData = {};

            for (let each in allPortions) {
                const portion = allPortions[each] || {};
                const portionWrapper = await PortionWrapper({ data: portion });
                portionApiData[portionWrapper.getId()] = portionWrapper.getBasicInfo();
            }

            const repetitionService = new RepetitionService();
            let repetitionApiData = {};

            const { count, rows: repetitions = [] } =
                (await repetitionService.findAndCountAll()) || {};
            if (count) {
                for (let index = 0; index < repetitions.length; index++) {
                    const { id, type } = repetitions[index] || {};
                    repetitionApiData[id] = { id, type };
                }
            }
            console.log("============================")
            console.log(" doctor id ", doctor_id);
            console.log(doctors)
            console.log({ medicinesArray })
            console.log({})
            console.log("============================")

            console.log("details before from a doctor start")
            console.log({providerLogo})
            console.log("details before from a doctor end")


            const {
                name: doctorName = "",
                city = "",
                degree = "",
                registrationNumber = "",
                email: doctorEmail = "",
                mobile_number: doctorMobileNumber = "",
                prefix = "",
                providerLogo = "",
                providerName = "",
                providerAddress = "",

            } = formatDoctorsData(
                doctors,
                { ...usersData },
                degrees,
                registrationsData,
                providerData,
                doctor_id
            );

            console.log("details from a doctor start")
            console.log({providerLogo})
            console.log("details from a doctor end")

            let patient_data = formatPatientData({
                ...{ [patientData.getPatientId()]: patientData.getBasicInfo() },
            }, { ...usersData })



            const { diagnosis, condition, symptoms, clinicalNotes } = formatCarePlanData({
                [carePlanData.getCarePlanId()]: {
                    ...carePlanData.getBasicInfo(),
                },
            }, conditions);

            let stringSymptomArray = [];
            let stringSymptom = "";

            if (symptoms) {
                try {
                    let object = JSON.parse(symptoms);
                    object.forEach((element) => {
                        let symName = element.symptomName;
                        let bodyPart =
                            element.bodyParts.length > 0
                                ? `(${String(element.bodyParts)})`
                                : "";
                        let duration = element.duration;
                        stringSymptomArray.push(`${symName} ${bodyPart} for ${duration}`);
                    });
                } catch (e) {
                    stringSymptom = symptoms;
                }
            }
            let symptoms_final_value = '';
            if (stringSymptomArray.length < 1) {
                symptoms_final_value = `${renderChiefComplaints({ symptoms: stringSymptom })}`
            } else {
                for (let i = 0; i < stringSymptomArray.length; i++) {
                    symptoms_final_value += `${stringSymptomArray[i]}` + '\n'
                }
            }
            let investigations = []
            let nextConsultation = []
            suggestedInvestigations = sortedInvestigations

            for (let each in suggestedInvestigations) {
                const { type } = suggestedInvestigations[each] || {};
                if (APPOINTMENT_TYPE[type].title !== "Consultation") { investigations.push(suggestedInvestigations[each]); continue }
                nextConsultation.push(suggestedInvestigations[each]);
            }

            const medicationsList = formatMedicationsData(medications, medicines);
            console.log("================================")
            console.log(JSON.stringify(medicationsList));
            console.log("diet real data start==============")
            console.log({ data: JSON.stringify({ ...dietApiData }) })
            console.log("diet real data end================")
            console.log("================================")
            let diet_old_data = { ...dietApiData }
            let diet_output = []

            for (let i in dietIds) {
                let food_group = []
                let dietobj = {}
                let formattedStartDate = ""
                let formattedEndDate = ""
                let diet_id = dietIds[i]
                let start_date = diet_old_data[diet_id]["diets"][diet_id]["basic_info"]["start_date"]
                let end_date = diet_old_data[diet_id]["diets"][diet_id]["basic_info"]["end_date"]
                console.log("----------------get testing info-------------- start -------")
                console.log(diet_old_data[diet_id]["diets"][diet_id]["basic_info"])
                if (start_date) formattedStartDate = moment(start_date);

                if (end_date) formattedEndDate = moment(end_date);

                console.log("----------------get testing info-------------- end ---------")
                let duration = null;
                let durationText = "";
                if (end_date) {
                    duration = formattedEndDate.diff(formattedStartDate, "days");
                    durationText = `${duration}${" "}days`;
                    if (duration >= 7) {
                        const weeks = Math.floor(duration / 7) || 0;
                        const days = duration % 7 || 0;
                        durationText = `${weeks > 0 ? `${weeks}${" "}${weeks > 1 ? "weeks" : "week"}${" "}` : ""
                            }${days > 0 ? `${days}${" "}${days > 1 ? "days" : "day"}` : ""} `;
                    }
                }

                dietobj.name = diet_old_data[dietIds[i]]["diets"][dietIds[i]]["basic_info"]["name"]
                dietobj.total_calories = diet_old_data[dietIds[i]]["diets"][dietIds[i]]["basic_info"]["total_calories"]
                dietobj.not_to_do = diet_old_data[dietIds[i]]["diets"][dietIds[i]]["details"]["not_to_do"]
                dietobj.repeat_days = diet_old_data[dietIds[i]]["diets"][dietIds[i]]["details"]["repeat_days"]
                dietobj.durationText = durationText
                // for food groups

                for (let key in diet_old_data[dietIds[i]]["diet_food_groups"]) {
                    console.log({ key, old_time: diet_old_data[dietIds[i]]["diet_food_groups"] })
                    let food_group_obj = {}
                    food_group_obj.time = timings[key]
                    food_group_obj.food_group_details_array = diet_old_data[dietIds[i]]["diet_food_groups"][key]
                    for (let new_food_item in food_group_obj.food_group_details_array) {
                        // let details = { ...diet_old_data[dietIds[i]]["food_items"][diet_old_data[dietIds[i]]["diet_food_groups"][key][new_food_item]['food_item_detail_id']]["basic_info"], ...diet_old_data[dietIds[i]]["food_item_details"][diet_old_data[dietIds[i]]["diet_food_groups"][key][new_food_item]['food_item_detail_id']] }
                        let fooditemdetail_id = diet_old_data[dietIds[i]]["diet_food_groups"][key][new_food_item]['food_item_detail_id']
                        let food_item_id = diet_old_data[dietIds[i]]["food_item_details"][fooditemdetail_id]["basic_info"]["food_item_id"]
                        let details = { ...diet_old_data[dietIds[i]]["food_items"][food_item_id]["basic_info"], ...diet_old_data[dietIds[i]]["food_item_details"][fooditemdetail_id] }
                        food_group_obj.food_group_details_array[new_food_item]['details'] = details
                        food_group_obj.food_group_details_array[new_food_item]['portion'] = portionApiData[details["basic_info"]["portion_id"]]
                        // diet_old_data[dietIds[i]]["diet_food_groups"][key][new_food_item]['details'] = diet_old_data[dietIds[i]]["diet_food_groups"][key][new_food_item]['food_item_detail_id']
                    }
                    food_group.push(food_group_obj)
                }
                dietobj.food_group = food_group
                // dietobj.food_item = diet_old_data[dietIds[i]]["food_items"]["food_item_detail_id"]
                diet_output.push(dietobj)
            }

            console.log("============my latest diet object start===============")
            console.log({ diet_output })

            console.log(JSON.stringify(diet_output))
            console.log("============my latest diet object end===============")




            let { date: prescriptionDate } = getLatestUpdateDate(medications);

            // workout logic here

            let workoutdata = { ...workoutApiData };
            let pre_workouts = []


            for (let i in workoutIds) {

                let { exercise_groups, exercise_details, exercises, repetitions } = workoutdata[workoutIds[i]]

                let newworkout = {}
                let workout = workoutdata[workoutIds[i]]["workouts"][workoutIds[i]]
                let { basic_info: { name }, end_date, exercise_group_ids, start_date, time, details: { not_to_do, repeat_days } } = workout
                let formattedStartDate = "--",
                    formattedEndDate = "--";

                let ex = [];
                let total_cal = 0
                for (let exgid in exercise_group_ids) {
                    let ex_group = exercise_groups[exercise_group_ids[exgid]]
                    let exdetails_id = ex_group["basic_info"]["exercise_detail_id"]
                    let { exercise_id, repetition_id, repetition_value } = exercise_details[exdetails_id]['basic_info']
                    total_cal += exercise_details[exdetails_id]["calorific_value"]
                    ex.push({
                        ex_group: ex_group,
                        ex_details: exercise_details[exdetails_id],
                        exercises: exercises[exercise_id],
                        repetitions: repetitions[repetition_id],
                        repetition_value
                    })
                }
                if (start_date) formattedStartDate = moment(start_date);
                if (end_date) formattedEndDate = moment(end_date);


                const formattedTime = moment(time).tz("Asia/Kolkata").format("hh:mm A");

                let duration = null;
                let durationText = "";

                if (end_date) {
                    duration = formattedEndDate.diff(formattedStartDate, "days");
                    durationText = `${duration}${" "}days`;
                    if (duration >= 7) {
                        const weeks = Math.floor(duration / 7) || 0;
                        const days = duration % 7 || 0;
                        durationText = `${weeks > 0 ? `${weeks}${" "}${weeks > 1 ? "weeks" : "week"}${" "}` : ""
                            }${days > 0 ? `${days}${" "}${days > 1 ? "days" : "day"}` : ""} `;
                    }
                }
                else {
                    durationText = "Long Term"
                }

                pre_workouts.push({ ex, total_cal, durationText, duration, name, end_date, start_date, formattedTime, not_to_do, repeat_days })
            }

            prescriptionDate = prescriptionDate || carePlanCreatedDate;
            let pre_data = {
                doctor_id,
                doctorName,
                city,
                degree,
                registrationNumber,
                doctorEmail,
                doctorMobileNumber,
                doctorSignImage: signature_pic,
                prefix,
                providerLogo,
                providerName,
                providerAddress,
                patient_data,
                diagnosis, condition, symptoms, clinicalNotes,
                data: JSON.stringify(patient_data),
                symptoms_final_value,
                medicinesArray,
                clinical_notes,
                follow_up_advise,
                registrations: registrationsData,
                creationDate: moment(prescriptionDate).add(330, "minutes").format("Do MMMM YYYY, h:mm a"),
                investigations, nextConsultation,
                medicationsList,
                diteFormattedData: { ...dietApiData },
                dietIds,
                diet_output,
                pre_workouts
            }
            console.log("diet real data start==============")
            console.log({ data: JSON.stringify({ ...dietApiData }) })
            console.log({ timings })
            console.log("diet real data end================")



            dataForPdf = {
                users: { ...usersData },
                // ...(permissions.includes(PERMISSIONS.MEDICATIONS.VIEW) && {
                //   medications,
                // }),
                // ...(permissions.includes(PERMISSIONS.MEDICATIONS.VIEW) && {
                //   medicines,
                // }),
                // medications, 
                // clinical_notes,
                // follow_up_advise,
                // clinical_notes,
                // follow_up_advise,
                medicines,
                care_plans: {
                    [carePlanData.getCarePlanId()]: {
                        ...carePlanData.getBasicInfo(),
                    },
                },
                doctors,
                degrees,
                portions: { ...portionApiData },
                repetitions: { ...repetitionApiData },
                conditions,
                providers: providerData,
                providerIcon,
                providerPrescriptionDetails,
                doctor_id: JSON.stringify(doctor_id),
                // registrations: registrationsData,
                // creationDate: carePlanCreatedDate,
                nextAppointmentDuration,
                // suggestedInvestigations: sortedInvestigations,
                // patients: {
                // ...{ [patientData.getPatientId()]: patientData.getBasicInfo() },
                // },
                diets_formatted_data: { ...dietApiData },
                workouts_formatted_data: { ...workoutApiData },
                workout_ids: workoutIds,
                diet_ids: dietIds,
                timings,
                currentTime: getDoctorCurrentTime(doctorUserId).format(
                    "Do MMMM YYYY, hh:mm a"
                ),
            };

            const templateHtml = fs.readFileSync(
                path.join("./routes/api/prescription/prescription.html"),
                "utf8"
            );
            const options = {
                format: "A4",
                headerTemplate: "<p></p>",
                footerTemplate: "<p></p>",
                displayHeaderFooter: false,
                margin: {
                    top: "40px",
                    bottom: "100px",
                },
                printBackground: true,
                path: "invoice.pdf",
            };
            console.log("--------------------------")
            console.log({ pre_data });
            console.log("--------------------------")

            let pdf_buffer_vaule = await html_to_pdf({ templateHtml, dataBinding: pre_data, options });
            res.contentType("application/pdf");
            return res.send(pdf_buffer_vaule);
        }
        catch (err) {
            console.log("Error while generating the prescription: ", err);
            return raiseServerError(res);
        }
    }
);

module.exports = router;
