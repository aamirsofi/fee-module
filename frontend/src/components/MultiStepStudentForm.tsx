import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiSave,
  FiUpload,
  FiX,
  FiCheck,
} from "react-icons/fi";
import {
  Student,
  AcademicYear,
  StudentAcademicRecord,
  Route,
  FeeStructure,
  CategoryHead,
} from "../types";
import { studentsService } from "../services/students.service";
import { studentAcademicRecordsService } from "../services/studentAcademicRecords.service";
import { academicYearsService } from "../services/academicYears.service";
import { routeService } from "../services/routeService";
import { feeStructuresService } from "../services/feeStructures.service";
import { uploadService } from "../services/uploadService";
import api from "../services/api";

interface Class {
  id: number;
  name: string;
}

interface MultiStepStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingStudent?: Student | null;
  duplicateStudent?: Student | null;
}

interface FormData {
  // Step 1: Admission Details
  studentId: string;
  admissionDate: string;
  admissionNumber: string;
  penNumber: string;
  aadharNumber: string;
  admissionFormNumber: string;
  name: string; // Full name (or keep firstName/lastName)
  contactNo: string;
  whatsappNo: string;
  emailAddress: string;
  status: "active" | "inactive" | "graduated" | "transferred";

  // Step 2: Academic Details
  academicYearId: string;
  classId: string;
  section: string;
  rollNumber: string;
  previousClass: string;
  previousSchoolName: string;

  // Step 3: Father/Guardian Details
  fatherName: string;
  fatherContactNumber: string;
  fatherOccupation: string;
  fatherQualification: string;
  fathersMonthlyIncome: string;
  fathersPhotoFile: File | null;
  fathersPhotoUrl: string;

  motherName: string;
  motherContactNumber: string;
  motherOccupation: string;
  motherQualification: string;
  mothersMonthlyIncome: string;
  mothersPhotoFile: File | null;
  mothersPhotoUrl: string;

  guardianName: string;
  guardiansRelation: string;
  guardianMobile: string;
  guardianAddress: string;
  guardianQualification: string;
  guardianOccupation: string;
  guardianMonthlyIncome: string;
  guardianPhotoFile: File | null;
  guardianPhotoUrl: string;

  // Step 4: Route and Other Details
  routeId: string;
  busId: string;
  busNumber: string;
  busSeatNumber: string;
  shift: string;
  categoryHeadId: string;
  openingBalance: string;
  isSibling: string; // 'yes' or 'no'
  bankName: string;
  branchName: string;
  bankIfsc: string;
  bankAccountNumber: string;

  // Step 5: Photos and Attachments
  profileImageFile: File | null;
  profileImageUrl: string;
  attachmentsFile: File | null;
  attachmentsUrl: string;

  // Legacy fields for backward compatibility
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  parentName: string;
  parentRelation: string;
  parentEmail: string;
  parentPhone: string;
  busFeeStructureId: string;
  photoFile: File | null;
  photoUrl: string;
}

const STEPS = [
  {
    id: 1,
    title: "Essential Information",
    description: "Required student and parent details",
  },
  {
    id: 2,
    title: "Additional Details",
    description: "Optional information (can be added later)",
  },
];

const DRAFT_STORAGE_KEY = "student_form_draft";

export default function MultiStepStudentForm({
  isOpen,
  onClose,
  onSuccess,
  editingStudent,
  duplicateStudent,
}: MultiStepStudentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  // Data dependencies
  const [currentAcademicYear, setCurrentAcademicYear] =
    useState<AcademicYear | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [busFeeStructures, setBusFeeStructures] = useState<FeeStructure[]>([]);
  const [categoryHeads, setCategoryHeads] = useState<CategoryHead[]>([]);
  const [lastStudentId, setLastStudentId] = useState<number | null>(null);
  const [nextStudentId, setNextStudentId] = useState<number | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState<FormData>({
    // Step 1: Admission Details
    studentId: "",
    admissionDate: getTodayDate(),
    admissionNumber: "",
    penNumber: "",
    aadharNumber: "",
    admissionFormNumber: "",
    name: "",
    contactNo: "",
    whatsappNo: "",
    emailAddress: "",
    status: "active",

    // Step 2: Academic Details
    academicYearId: "",
    classId: "",
    section: "",
    rollNumber: "",
    previousClass: "",
    previousSchoolName: "",

    // Step 3: Father/Guardian Details
    fatherName: "",
    fatherContactNumber: "",
    fatherOccupation: "",
    fatherQualification: "",
    fathersMonthlyIncome: "",
    fathersPhotoFile: null,
    fathersPhotoUrl: "",
    motherName: "",
    motherContactNumber: "",
    motherOccupation: "",
    motherQualification: "",
    mothersMonthlyIncome: "",
    mothersPhotoFile: null,
    mothersPhotoUrl: "",
    guardianName: "",
    guardiansRelation: "",
    guardianMobile: "",
    guardianAddress: "",
    guardianQualification: "",
    guardianOccupation: "",
    guardianMonthlyIncome: "",
    guardianPhotoFile: null,
    guardianPhotoUrl: "",

    // Step 4: Route and Other Details
    routeId: "",
    busId: "",
    busNumber: "",
    busSeatNumber: "",
    shift: "",
    categoryHeadId: "",
    openingBalance: "",
    isSibling: "no",
    bankName: "",
    branchName: "",
    bankIfsc: "",
    bankAccountNumber: "",

    // Step 5: Photos and Attachments
    profileImageFile: null,
    profileImageUrl: "",
    attachmentsFile: null,
    attachmentsUrl: "",

    // Legacy fields for backward compatibility
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    parentName: "",
    parentRelation: "",
    parentEmail: "",
    parentPhone: "",
    busFeeStructureId: "",
    photoFile: null,
    photoUrl: "",
  });

  // Manage photo object URL lifecycle (must be after formData declaration)
  useEffect(() => {
    if (formData.photoFile && formData.photoFile instanceof File) {
      try {
        const objectUrl = URL.createObjectURL(formData.photoFile);
        setPhotoPreviewUrl(objectUrl);
        return () => {
          URL.revokeObjectURL(objectUrl);
          setPhotoPreviewUrl(null);
        };
      } catch (err) {
        setPhotoPreviewUrl(null);
      }
    } else {
      setPhotoPreviewUrl(null);
    }
  }, [formData.photoFile]);

  // Ensure academicYearId is set whenever currentAcademicYear changes
  useEffect(() => {
    if (currentAcademicYear && !formData.academicYearId) {
      setFormData((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear.id.toString(),
      }));
    }
  }, [currentAcademicYear]);

  // Load dependencies and check for draft only when modal is open
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setCurrentStep(1);
      setError("");
      return;
    }

    // Only load when modal/page is actually open
    loadDependencies();
    checkForDraft(); // Check for draft but don't auto-load
    if (editingStudent) {
      loadStudentData();
    } else if (duplicateStudent) {
      loadDuplicateStudentData();
    } else {
      // For new student, ensure admission date is set to today
      setFormData((prev) => ({ ...prev, admissionDate: getTodayDate() }));

      // Ask if they want to load draft
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const shouldLoadDraft = confirm(
          "You have a saved draft. Do you want to load it?"
        );
        if (shouldLoadDraft) {
          loadDraft();
        } else {
          clearDraft(); // Clear draft if user doesn't want it
          // Reset admission date to today after clearing draft
          setFormData((prev) => ({ ...prev, admissionDate: getTodayDate() }));
        }
      }
    }
  }, [isOpen, editingStudent, duplicateStudent]);

  const loadDependencies = async () => {
    try {
      // Get schoolId for all API calls
      // Check URL params first (for super admin), then user context
      const urlParams = new URLSearchParams(window.location.search);
      const schoolIdFromUrl = urlParams.get("schoolId");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const schoolId = schoolIdFromUrl
        ? parseInt(schoolIdFromUrl, 10)
        : user?.schoolId;

      // For super admin, schoolId must be in URL params
      if (user?.role === 'super_admin' && !schoolIdFromUrl) {
        // Show error message to user
        setError("Please select a school from the dropdown on the Students page before adding a student. You will be redirected back.");
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/super-admin/students';
        }, 2000);
        return;
      }

      // For regular admin, schoolId must be in user context
      if (!schoolId) {
        setError("School context is required. Please ensure you are logged in with a school assigned.");
        return;
      }

      // Load last student ID (only for new students, not when editing)
      if (schoolId && !editingStudent) {
        try {
          const lastIdData = await studentsService.getLastStudentId(schoolId);
          setLastStudentId(lastIdData.lastStudentId);
          setNextStudentId(lastIdData.nextStudentId);
          // Auto-fill next student ID
          if (lastIdData.nextStudentId && !formData.studentId) {
            setFormData((prev) => ({
              ...prev,
              studentId: lastIdData.nextStudentId.toString(),
            }));
          }
        } catch (err) {
          // Failed to load last student ID
        }
      }

      // Load current academic year
      try {
        const year = await academicYearsService.getCurrent(schoolId);
        setCurrentAcademicYear(year);
        if (year) {
          setFormData((prev) => ({
            ...prev,
            academicYearId: year.id.toString(),
          }));
        }
      } catch (err: any) {
        // Don't fail the whole form if academic year fails
      }

      // Load classes
      try {
        const classesParams: any = { page: 1, limit: 100 };
        if (schoolId) {
          classesParams.schoolId = schoolId;
        }
        const classesResponse = await api.instance.get("/classes", {
          params: classesParams,
        });

        // Extract data array from paginated response
        // axios response.data contains the JSON body, which has { data: [...], meta: {...} }
        let classesData: Class[] = [];
        if (classesResponse.data) {
          if (Array.isArray(classesResponse.data)) {
            // Direct array response
            classesData = classesResponse.data;
          } else if (
            classesResponse.data.data &&
            Array.isArray(classesResponse.data.data)
          ) {
            // Paginated response { data: [...], meta: {...} }
            classesData = classesResponse.data.data;
          }
        }
        setClasses(classesData);
      } catch (err: any) {
        setClasses([]); // Set empty array on error
      }

      // Load routes (only if schoolId is available)
      if (schoolId) {
        try {
          const routesResponse = await routeService.getRoutes({
            page: 1,
            limit: 100,
            schoolId: schoolId,
          });
          setRoutes(routesResponse.data || []);
        } catch (err: any) {
          setRoutes([]);
        }
      } else {
        setRoutes([]);
      }

      // Load category heads
      try {
        const params: Record<string, string | number> = { page: 1, limit: 100 };
        if (schoolId) {
          params.schoolId = schoolId;
        }
        const response = await api.instance.get("/super-admin/category-heads", { params });
        const categoryHeadsData = response.data.data || response.data || [];
        setCategoryHeads(Array.isArray(categoryHeadsData) ? categoryHeadsData : []);
      } catch (err: any) {
        setCategoryHeads([]);
      }

      // Load transport fee structures
      try {
        const feeStructures = await feeStructuresService.getAll();
        const transportFees = feeStructures.filter(
          (fs) => fs.category?.type === "transport"
        );
        setBusFeeStructures(transportFees || []);
      } catch (err: any) {
        setBusFeeStructures([]);
      }
    } catch (err: any) {
      // Failed to load dependencies
    }
  };

  const loadStudentData = async () => {
    if (!editingStudent) return;

    try {
      // Load student academic record
      const record = await studentAcademicRecordsService.getCurrent(
        editingStudent.id
      );

      // Format admission date if it's a Date object
      const admissionDateStr = editingStudent.admissionDate 
        ? (typeof editingStudent.admissionDate === 'string' 
          ? editingStudent.admissionDate 
          : new Date(editingStudent.admissionDate).toISOString().split('T')[0])
        : "";

      setFormData({
        studentId: editingStudent.studentId || "",
        admissionDate: admissionDateStr,
        admissionNumber: editingStudent.admissionNumber || "",
        status: editingStudent.status,
        // Map firstName + lastName to name for the form
        name: `${editingStudent.firstName || ""} ${editingStudent.lastName || ""}`.trim(),
        firstName: editingStudent.firstName || "",
        lastName: editingStudent.lastName || "",
        email: editingStudent.email || "",
        emailAddress: editingStudent.email || "",
        phone: editingStudent.phone || "",
        contactNo: editingStudent.phone || "",
        address: editingStudent.address || "",
        dateOfBirth: editingStudent.dateOfBirth 
          ? (typeof editingStudent.dateOfBirth === 'string' 
            ? editingStudent.dateOfBirth 
            : new Date(editingStudent.dateOfBirth).toISOString().split('T')[0])
          : "",
        gender: editingStudent.gender || "",
        bloodGroup: editingStudent.bloodGroup || "",
        parentName: editingStudent.parentName || "",
        parentRelation: editingStudent.parentRelation || "",
        parentEmail: editingStudent.parentEmail || "",
        parentPhone: editingStudent.parentPhone || "",
        academicYearId: record?.academicYearId.toString() || "",
        classId: record?.classId.toString() || "",
        section: record?.section || "",
        rollNumber: record?.rollNumber || "",
        routeId: "",
        busFeeStructureId: "",
        openingBalance: "",
        bankAccountNumber: "",
        bankName: "",
        bankIfsc: "",
        photoFile: null,
        photoUrl: editingStudent.photoUrl || "",
        // Initialize other required fields
        penNumber: "",
        aadharNumber: "",
        admissionFormNumber: "",
        whatsappNo: "",
        previousClass: "",
        previousSchoolName: "",
        fatherName: "",
        fatherContactNumber: "",
        fatherOccupation: "",
        fatherQualification: "",
        fathersMonthlyIncome: "",
        fathersPhotoFile: null,
        fathersPhotoUrl: "",
        motherName: "",
        motherContactNumber: "",
        motherOccupation: "",
        motherQualification: "",
        mothersMonthlyIncome: "",
        mothersPhotoFile: null,
        mothersPhotoUrl: "",
        guardianName: "",
        guardiansRelation: "",
        guardianMobile: "",
        guardianAddress: "",
        guardianQualification: "",
        guardianOccupation: "",
        guardianMonthlyIncome: "",
        guardianPhotoFile: null,
        guardianPhotoUrl: "",
        busId: "",
        busNumber: "",
        busSeatNumber: "",
        shift: "",
        categoryHeadId: "",
        isSibling: "no",
        branchName: "",
        profileImageFile: null,
        profileImageUrl: "",
        attachmentsFile: null,
        attachmentsUrl: "",
      });
    } catch (err) {
      // Failed to load student data
    }
  };

  const loadDuplicateStudentData = async () => {
    if (!duplicateStudent) return;

    try {
      // Load student academic record
      const record = await studentAcademicRecordsService.getCurrent(
        duplicateStudent.id
      );

      // Get next student ID for the duplicate
      const urlParams = new URLSearchParams(window.location.search);
      const schoolIdFromUrl = urlParams.get("schoolId");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const schoolId = schoolIdFromUrl
        ? parseInt(schoolIdFromUrl, 10)
        : user?.schoolId || duplicateStudent.schoolId;

      let nextStudentId: number | null = null;
      if (schoolId) {
        try {
          const lastIdData = await studentsService.getLastStudentId(schoolId);
          nextStudentId = lastIdData.nextStudentId;
        } catch (err) {
          // Failed to load last student ID
        }
      }

      // Format admission date if it's a Date object
      const admissionDateStr = getTodayDate(); // Use today's date for duplicate

      // Generate a unique email by appending a timestamp or number
      const originalEmail = duplicateStudent.email || "";
      const emailParts = originalEmail.split("@");
      const newEmail = emailParts[0] + "+copy@" + (emailParts[1] || "example.com");

      setFormData({
        studentId: nextStudentId ? nextStudentId.toString() : "",
        admissionDate: admissionDateStr,
        admissionNumber: "", // Clear admission number for duplicate
        status: "active",
        // Map firstName + lastName to name for the form
        name: `${duplicateStudent.firstName || ""} ${duplicateStudent.lastName || ""}`.trim(),
        firstName: duplicateStudent.firstName || "",
        lastName: duplicateStudent.lastName || "",
        email: newEmail,
        emailAddress: newEmail,
        phone: duplicateStudent.phone || "",
        contactNo: duplicateStudent.phone || "",
        address: duplicateStudent.address || "",
        dateOfBirth: duplicateStudent.dateOfBirth 
          ? (typeof duplicateStudent.dateOfBirth === 'string' 
            ? duplicateStudent.dateOfBirth 
            : new Date(duplicateStudent.dateOfBirth).toISOString().split('T')[0])
          : "",
        gender: duplicateStudent.gender || "",
        bloodGroup: duplicateStudent.bloodGroup || "",
        parentName: duplicateStudent.parentName || "",
        parentRelation: duplicateStudent.parentRelation || "",
        parentEmail: duplicateStudent.parentEmail || "",
        parentPhone: duplicateStudent.parentPhone || "",
        academicYearId: record?.academicYearId.toString() || "",
        classId: record?.classId.toString() || "",
        section: record?.section || "",
        rollNumber: "", // Clear roll number for duplicate
        routeId: duplicateStudent.routeId?.toString() || "",
        routePlanId: duplicateStudent.routePlanId?.toString() || "",
        busFeeStructureId: duplicateStudent.routePlanId?.toString() || "",
        openingBalance: duplicateStudent.openingBalance?.toString() || "",
        bankAccountNumber: duplicateStudent.bankAccountNumber || "",
        bankName: duplicateStudent.bankName || "",
        bankIfsc: duplicateStudent.bankIfsc || "",
        photoFile: null,
        photoUrl: duplicateStudent.photoUrl || "",
        // Copy additional fields
        penNumber: duplicateStudent.penNumber || "",
        aadharNumber: "", // Clear Aadhar number for duplicate
        admissionFormNumber: duplicateStudent.admissionFormNumber || "",
        whatsappNo: duplicateStudent.whatsappNo || "",
        previousClass: "",
        previousSchoolName: "",
        fatherName: duplicateStudent.parentName && duplicateStudent.parentRelation === "father" ? duplicateStudent.parentName : "",
        fatherContactNumber: duplicateStudent.parentPhone && duplicateStudent.parentRelation === "father" ? duplicateStudent.parentPhone : "",
        fatherOccupation: "",
        fatherQualification: "",
        fathersMonthlyIncome: "",
        fathersPhotoFile: null,
        fathersPhotoUrl: "",
        motherName: "",
        motherContactNumber: "",
        motherOccupation: "",
        motherQualification: "",
        mothersMonthlyIncome: "",
        mothersPhotoFile: null,
        mothersPhotoUrl: "",
        guardianName: duplicateStudent.parentName && duplicateStudent.parentRelation === "guardian" ? duplicateStudent.parentName : "",
        guardiansRelation: duplicateStudent.parentRelation === "guardian" ? duplicateStudent.parentRelation : "",
        guardianMobile: duplicateStudent.parentPhone && duplicateStudent.parentRelation === "guardian" ? duplicateStudent.parentPhone : "",
        guardianAddress: "",
        guardianQualification: "",
        guardianOccupation: "",
        guardianMonthlyIncome: "",
        guardianPhotoFile: null,
        guardianPhotoUrl: "",
        busId: "",
        busNumber: duplicateStudent.busNumber || "",
        busSeatNumber: duplicateStudent.busSeatNumber || "",
        shift: duplicateStudent.shift || "",
        categoryHeadId: duplicateStudent.categoryHeadId?.toString() || "",
        isSibling: duplicateStudent.isSibling ? "yes" : "no",
        branchName: duplicateStudent.branchName || "",
        profileImageFile: null,
        profileImageUrl: "",
        attachmentsFile: null,
        attachmentsUrl: "",
      });
    } catch (err) {
      console.error("Failed to load duplicate student data:", err);
    }
  };

  const checkForDraft = () => {
    if (editingStudent) {
      setHasDraft(false);
      return;
    }
    // Don't auto-load draft - let user choose
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      setHasDraft(true);
      // Don't auto-load, just mark that draft exists
    } else {
      setHasDraft(false);
    }
  };

  const loadDraft = () => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
        setHasDraft(true);
      } catch (err) {
        // Failed to parse draft
      }
    }
  };

  const saveDraft = async () => {
    if (editingStudent) return; // Don't save draft for edits

    try {
      setSavingDraft(true);
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      setHasDraft(true);

      // Optionally save to backend as well
      // await studentsService.saveDraft(formData);
    } catch (err) {
      // Failed to save draft
    } finally {
      setSavingDraft(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: {
        // Step 1: Essential Information - Only name, email, class, parent name, and parent contact are required
        const hasName = formData.name && formData.name.trim().length >= 2;
        const hasEmail = formData.emailAddress && formData.emailAddress.includes("@");
        const hasClass = formData.classId && formData.classId.trim() !== "" && parseInt(formData.classId) > 0;
        const hasParentName = !!(formData.fatherName?.trim() || formData.guardianName?.trim() || formData.parentName?.trim());
        const hasParentContact = !!(formData.fatherContactNumber?.trim() || formData.guardianMobile?.trim() || formData.parentPhone?.trim());
        
        const step1Valid = hasName && hasEmail && hasClass && hasParentName && hasParentContact;
        
        if (!step1Valid) {
          // Log which field is missing for debugging
          console.log('Validation failed:', {
            hasName,
            hasEmail,
            hasClass,
            hasParentName,
            hasParentContact,
            classId: formData.classId,
            parentName: formData.fatherName || formData.guardianName || formData.parentName,
            parentContact: formData.fatherContactNumber || formData.guardianMobile || formData.parentPhone
          });
        }
        return step1Valid;
      }
      case 2:
        // Step 2: Additional Details - All optional
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      setError("");
    } else {
      // Provide specific error message
      const missingFields: string[] = [];
      if (!formData.name || formData.name.trim().length < 2) {
        missingFields.push("Full Name");
      }
      if (!formData.emailAddress || !formData.emailAddress.includes("@")) {
        missingFields.push("Email Address");
      }
      if (!formData.classId || formData.classId.trim() === "" || parseInt(formData.classId) <= 0) {
        missingFields.push("Class");
      }
      if (!formData.fatherName?.trim() && !formData.guardianName?.trim() && !formData.parentName?.trim()) {
        missingFields.push("Parent/Guardian Name");
      }
      if (!formData.fatherContactNumber?.trim() && !formData.guardianMobile?.trim() && !formData.parentPhone?.trim()) {
        missingFields.push("Contact Number");
      }
      
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      // Get schoolId from URL params (for super admin) or user context
      const urlParams = new URLSearchParams(window.location.search);
      const schoolIdFromUrl = urlParams.get("schoolId");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Parse schoolId, handling empty strings and invalid values
      let schoolId: number | undefined;
      if (schoolIdFromUrl && schoolIdFromUrl !== '' && schoolIdFromUrl !== 'all') {
        const parsed = parseInt(schoolIdFromUrl, 10);
        if (!isNaN(parsed) && parsed > 0) {
          schoolId = parsed;
        }
      }
      if (!schoolId && user?.schoolId) {
        const userSchoolId = typeof user.schoolId === 'number' ? user.schoolId : parseInt(user.schoolId, 10);
        if (!isNaN(userSchoolId) && userSchoolId > 0) {
          schoolId = userSchoolId;
        }
      }


      // For super admin, schoolId must be in URL params
      if (user?.role === 'super_admin') {
        if (!schoolIdFromUrl || schoolIdFromUrl === '' || schoolIdFromUrl === 'all' || !schoolId) {
          setError("Please select a school from the dropdown before adding a student. Current URL: " + window.location.href);
          setLoading(false);
          return;
        }
      }

      if (!schoolId) {
        setError("School context required. Please select a school or ensure you are logged in with a school assigned.");
        setLoading(false);
        return;
      }

      // Split full name into firstName and lastName
      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

      // Validate required fields before submitting
      if (!formData.studentId || !formData.studentId.trim()) {
        setError("Student ID is required");
        setLoading(false);
        return;
      }
      if (!firstName || firstName.length < 2) {
        setError("Name must be at least 2 characters");
        setLoading(false);
        return;
      }
      if (!lastName || lastName.length < 2) {
        setError("Last name is required (please provide full name)");
        setLoading(false);
        return;
      }
      if (!formData.emailAddress || !formData.emailAddress.trim()) {
        setError("Email address is required");
        setLoading(false);
        return;
      }
      if (!formData.admissionDate) {
        setError("Admission date is required");
        setLoading(false);
        return;
      }

      // Prepare student data - only include fields that have values
      const studentData: any = {
        studentId: formData.studentId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: formData.emailAddress.trim().toLowerCase(),
        admissionDate: formData.admissionDate,
      };

      // Add optional fields only if they have values
      if (formData.contactNo?.trim()) {
        studentData.phone = formData.contactNo.trim();
      } else if (formData.phone?.trim()) {
        studentData.phone = formData.phone.trim();
      }

      if (formData.address?.trim()) {
        studentData.address = formData.address.trim();
      }

      if (formData.dateOfBirth?.trim()) {
        studentData.dateOfBirth = formData.dateOfBirth.trim();
      }

      if (formData.gender?.trim()) {
        studentData.gender = formData.gender.trim();
      }

      if (formData.bloodGroup?.trim()) {
        studentData.bloodGroup = formData.bloodGroup.trim();
      }

      if (formData.admissionNumber?.trim()) {
        studentData.admissionNumber = formData.admissionNumber.trim();
      }

      // Use father name as primary parent, fallback to guardian
      // Priority: fatherName > guardianName > parentName
      let parentName: string | undefined;
      let parentPhone: string | undefined;
      let parentRelation: string | undefined;

      if (formData.fatherName?.trim()) {
        parentName = formData.fatherName.trim();
        parentPhone = formData.fatherContactNumber?.trim() || formData.parentPhone?.trim();
        parentRelation = formData.parentRelation?.trim() || "father";
      } else if (formData.guardianName?.trim()) {
        parentName = formData.guardianName.trim();
        parentPhone = formData.guardianMobile?.trim() || formData.parentPhone?.trim();
        parentRelation = formData.parentRelation?.trim() || formData.guardiansRelation?.trim() || "guardian";
      } else if (formData.parentName?.trim()) {
        parentName = formData.parentName.trim();
        parentPhone = formData.parentPhone?.trim();
        parentRelation = formData.parentRelation?.trim();
      }

      if (parentName) {
        studentData.parentName = parentName;
      }

      if (formData.parentEmail?.trim()) {
        studentData.parentEmail = formData.parentEmail.trim().toLowerCase();
      }

      if (parentPhone) {
        studentData.parentPhone = parentPhone;
      }

      if (parentRelation) {
        studentData.parentRelation = parentRelation;
      }

      if (formData.status) {
        studentData.status = formData.status;
      }

      const photoUrl = formData.photoUrl?.trim() || formData.profileImageUrl?.trim();
      if (photoUrl) {
        studentData.photoUrl = photoUrl;
      }

      // Add route and transport information
      if (formData.routeId && formData.routeId.trim() !== "") {
        const parsedRouteId = parseInt(formData.routeId);
        if (!isNaN(parsedRouteId) && parsedRouteId > 0) {
          studentData.routeId = parsedRouteId;
        }
      }

      if (formData.busFeeStructureId && formData.busFeeStructureId.trim() !== "") {
        const parsedRoutePlanId = parseInt(formData.busFeeStructureId);
        if (!isNaN(parsedRoutePlanId) && parsedRoutePlanId > 0) {
          studentData.routePlanId = parsedRoutePlanId;
        }
      } else if (formData.routeId && formData.routeId.trim() !== "") {
        // Try to find a route plan for this route and class
        const parsedRouteId = parseInt(formData.routeId);
        if (!isNaN(parsedRouteId) && parsedRouteId > 0) {
          try {
            const routePlansResponse = await api.instance.get("/super-admin/route-plans", {
              params: {
                routeId: parsedRouteId,
                classId: formData.classId && formData.classId.trim() !== "" ? parseInt(formData.classId) : undefined,
                schoolId: schoolId,
                limit: 1,
                page: 1,
              },
            });
            const routePlans = routePlansResponse.data?.data || routePlansResponse.data || [];
            if (routePlans.length > 0 && routePlans[0].id) {
              studentData.routePlanId = routePlans[0].id;
            }
          } catch (err) {
            // Route plan lookup failed, continue without it
          }
        }
      }

      if (formData.busNumber?.trim()) {
        studentData.busNumber = formData.busNumber.trim();
      }

      if (formData.busSeatNumber?.trim()) {
        studentData.busSeatNumber = formData.busSeatNumber.trim();
      }

      if (formData.shift?.trim()) {
        studentData.shift = formData.shift.trim();
      }

      // Add financial information
      if (formData.openingBalance && formData.openingBalance.trim() !== "") {
        const openingBalance = parseFloat(formData.openingBalance);
        if (!isNaN(openingBalance)) {
          studentData.openingBalance = openingBalance;
        }
      }

      // Add bank account information
      if (formData.bankName?.trim()) {
        studentData.bankName = formData.bankName.trim();
      }

      if (formData.branchName?.trim()) {
        studentData.branchName = formData.branchName.trim();
      }

      if (formData.bankIfsc?.trim()) {
        studentData.bankIfsc = formData.bankIfsc.trim();
      }

      if (formData.bankAccountNumber?.trim()) {
        studentData.bankAccountNumber = formData.bankAccountNumber.trim();
      }

      // Add additional information
      if (formData.penNumber?.trim()) {
        studentData.penNumber = formData.penNumber.trim();
      }

      if (formData.aadharNumber?.trim()) {
        studentData.aadharNumber = formData.aadharNumber.trim();
      }

      if (formData.admissionFormNumber?.trim()) {
        studentData.admissionFormNumber = formData.admissionFormNumber.trim();
      }

      if (formData.whatsappNo?.trim()) {
        studentData.whatsappNo = formData.whatsappNo.trim();
      }

      if (formData.categoryHeadId && formData.categoryHeadId.trim() !== "") {
        const parsedCategoryHeadId = parseInt(formData.categoryHeadId);
        if (!isNaN(parsedCategoryHeadId) && parsedCategoryHeadId > 0) {
          studentData.categoryHeadId = parsedCategoryHeadId;
        }
      }

      if (formData.isSibling === "yes") {
        studentData.isSibling = true;
      } else if (formData.isSibling === "no") {
        studentData.isSibling = false;
      }

      // Upload photo if a new file is selected
      if (formData.photoFile && formData.photoFile instanceof File) {
        try {
          const uploadResult = await uploadService.uploadPhoto(formData.photoFile);
          studentData.photoUrl = uploadResult.photoUrl;
          console.log("Photo uploaded successfully:", uploadResult.photoUrl);
        } catch (uploadError: any) {
          const errorMessage = uploadError.response?.data?.message || "Failed to upload photo";
          setError(errorMessage);
          setLoading(false);
          return;
        }
      } else if (formData.photoUrl && !editingStudent) {
        // If creating new student and photoUrl exists but no new file, keep existing photoUrl
        studentData.photoUrl = formData.photoUrl;
      } else if (editingStudent && formData.photoUrl) {
        // If editing and photoUrl exists (from existing student or previous upload), use it
        studentData.photoUrl = formData.photoUrl;
      }

      // Debug: Log the student data being sent
      console.log("Student data being sent:", JSON.stringify(studentData, null, 2));

      let student: Student;

      if (editingStudent) {
        student = await studentsService.update(editingStudent.id, studentData);
      } else {
        try {
          // Pass schoolId to the create method for super admin
          student = await studentsService.create(studentData, schoolId);
        } catch (createError: any) {
          const errorMessage = createError.response?.data?.message || 
                              (Array.isArray(createError.response?.data?.message) 
                                ? createError.response.data.message.join(", ") 
                                : createError.message) ||
                              "Failed to create student";
          setError(errorMessage);
          setLoading(false);
          return;
        }
      }

      // Create/Update academic record
      console.log("Form data before academic record save:", {
        classId: formData.classId,
        academicYearId: formData.academicYearId,
        section: formData.section,
        rollNumber: formData.rollNumber
      });
      
      if (formData.classId && formData.classId.trim() !== "" && formData.academicYearId && formData.academicYearId.trim() !== "") {
        const parsedClassId = parseInt(formData.classId);
        const parsedAcademicYearId = parseInt(formData.academicYearId);
        
        console.log("Parsed values:", {
          parsedClassId,
          parsedAcademicYearId,
          isValidClassId: !isNaN(parsedClassId) && parsedClassId > 0,
          isValidAcademicYearId: !isNaN(parsedAcademicYearId) && parsedAcademicYearId > 0
        });
        
        if (!isNaN(parsedClassId) && parsedClassId > 0 && !isNaN(parsedAcademicYearId) && parsedAcademicYearId > 0) {
          const academicRecordData = {
            studentId: student.id,
            academicYearId: parsedAcademicYearId,
            classId: parsedClassId,
            schoolId: schoolId, // Add schoolId for direct queries and data integrity
            section: formData.section?.trim() || undefined,
            rollNumber: formData.rollNumber?.trim() || undefined,
            status: "active" as const,
          };

          try {
            // Check if a record exists for this student and academic year
            // First try to get records filtered by academic year
            const allRecords = await studentAcademicRecordsService.getAll(student.id, parsedAcademicYearId);
            console.log("All academic records for student:", allRecords);
            console.log("Looking for academicYearId:", parsedAcademicYearId);
            console.log("Academic record data to save:", academicRecordData);
            
            // Find record matching the academic year (should be first result if getAll filters correctly)
            let existingRecord = allRecords.find(
              (record) => record.academicYearId === parsedAcademicYearId
            );
            
            // If not found, try getting all records without filter
            if (!existingRecord) {
              console.log("Record not found with filter, trying without filter...");
              const allRecordsNoFilter = await studentAcademicRecordsService.getAll(student.id);
              existingRecord = allRecordsNoFilter.find(
                (record) => record.academicYearId === parsedAcademicYearId
              );
              console.log("All records without filter:", allRecordsNoFilter);
            }
            
            console.log("Existing record found:", existingRecord);
            
            if (existingRecord && existingRecord.id) {
              // Update existing record
              console.log("Updating academic record ID:", existingRecord.id);
              const updated = await studentAcademicRecordsService.update(
                existingRecord.id,
                academicRecordData
              );
              console.log("Academic record updated successfully:", updated);
            } else {
              // Create new record
              console.log("Creating new academic record");
              const created = await studentAcademicRecordsService.create(academicRecordData);
              console.log("Academic record created successfully:", created);
            }
          } catch (err: any) {
            // Show error to user but don't block form submission
            const errorMsg = err.response?.data?.message || err.message || "Unknown error";
            setError(`Warning: Academic record could not be saved: ${errorMsg}. Please update it manually.`);
            console.error("Error saving academic record:", err);
            console.error("Error details:", err.response?.data);
          }
        } else {
          setError("Warning: Invalid Class or Academic Year. Please check your selections.");
        }
      } else {
        setError("Warning: Academic record was not created because Class or Academic Year is missing. Please update it manually.");
      }

      // All fields (route, bus fee structure, opening balance, bank account) are now saved
      // as part of the student update above

      clearDraft();
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save student");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      admissionDate: getTodayDate(),
      admissionNumber: "",
      status: "active",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      parentName: "",
      parentRelation: "",
      parentEmail: "",
      parentPhone: "",
      academicYearId: currentAcademicYear?.id.toString() || "",
      classId: "",
      section: "",
      rollNumber: "",
      routeId: "",
      busFeeStructureId: "",
      openingBalance: "",
      bankAccountNumber: "",
      bankName: "",
      bankIfsc: "",
      photoFile: null,
      photoUrl: "",
    });
    setCurrentStep(1);
    setError("");
    setHasDraft(false);
  };

  const handleClose = () => {
    if (hasDraft && !editingStudent) {
      if (confirm("You have unsaved changes. Do you want to save as draft?")) {
        saveDraft();
      }
    }
    resetForm();
    onClose();
  };

  const progress = (currentStep / STEPS.length) * 100;

  // Don't render if modal/page is not open
  if (!isOpen) {
    return null;
  }

  // Check if we're on the AddEditStudent page (full page mode) or modal mode
  const isFullPageMode =
    window.location.pathname.includes("/super-admin/students/new") ||
    (window.location.pathname.includes("/super-admin/students/") &&
      window.location.pathname.includes("/edit"));

  const cardContent = (
    <Card
      className={`w-full ${
        isFullPageMode ? "max-w-6xl mx-auto shadow-lg" : "max-w-4xl"
      } max-h-[90vh] overflow-hidden flex flex-col`}
    >
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {editingStudent ? "Edit Student" : duplicateStudent ? "Duplicate Student" : "Add New Student"}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {STEPS.length}:{" "}
              {STEPS[currentStep - 1].title}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasDraft && !editingStudent && (
              <Badge variant="secondary" className="gap-1">
                <FiSave className="w-3 h-3" />
                Draft Saved
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <FiX className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id <= currentStep ? "text-indigo-600 font-semibold" : ""
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    step.id < currentStep
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : step.id === currentStep
                      ? "border-indigo-600 text-indigo-600"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {step.id < currentStep ? (
                    <FiCheck className="w-3 h-3" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="mt-1 text-center max-w-[60px]">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Essential Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Student Information</h3>
              <p className="text-sm text-gray-500 mb-4">Fill in the essential details to create a student record</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Student Name - Required */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter student's full name"
                  required
                  className="w-full"
                />
              </div>

              {/* Email - Required */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, emailAddress: e.target.value })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Class - Required */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class *
                </label>
                <Select
                  key={`class-select-form-${classes.length}`}
                  value={formData.classId || undefined}
                  onValueChange={(value) => {
                    console.log("Class changed from", formData.classId, "to", value);
                    setFormData({ ...formData, classId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(classes) && classes.length > 0 ? (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {classes?.length === 0
                          ? "No classes available"
                          : "Loading classes..."}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year - Auto-filled */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Academic Year
                </label>
                <Input
                  value={currentAcademicYear?.name || "Loading..."}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              {/* Section - Optional */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section
                </label>
                <Input
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  placeholder="A, B, C..."
                />
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Parent Name - Required (Father or Guardian) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent/Guardian Name *
                  </label>
                  <Input
                    value={formData.fatherName || formData.guardianName || formData.parentName || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Update both fatherName and parentName (father takes priority)
                      // If guardian name exists, also update guardian
                      if (formData.guardianName && !formData.fatherName) {
                        setFormData({ ...formData, guardianName: value, parentName: value });
                      } else {
                        setFormData({ ...formData, fatherName: value, parentName: value });
                      }
                    }}
                    placeholder="Enter parent or guardian name"
                    required
                  />
                </div>

                {/* Parent Contact - Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <Input
                    type="tel"
                    value={formData.fatherContactNumber || formData.guardianMobile || formData.parentPhone || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Update both fatherContactNumber and parentPhone (father takes priority)
                      // If guardian mobile exists, also update guardian
                      if (formData.guardianMobile && !formData.fatherContactNumber) {
                        setFormData({ ...formData, guardianMobile: value, parentPhone: value });
                      } else {
                        setFormData({ ...formData, fatherContactNumber: value, parentPhone: value });
                      }
                    }}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> You can add more details like admission number, address, route, photos, etc. in the next step. 
                All other fields are optional and can be filled later.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Additional Details (All Optional) */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
              <p className="text-sm text-gray-500 mb-4">All fields below are optional. You can add them now or update them later.</p>
            </div>

            {/* Admission Details Section */}
            <Collapsible className="border rounded-lg p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-semibold text-gray-700">Admission Details</span>
                <FiChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student ID
                    </label>
                    <Input
                      value={formData.studentId}
                      onChange={(e) =>
                        setFormData({ ...formData, studentId: e.target.value })
                      }
                      placeholder={nextStudentId ? nextStudentId.toString() : "Auto-generated"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admission Date
                    </label>
                    <Input
                      type="date"
                      value={formData.admissionDate}
                      onChange={(e) =>
                        setFormData({ ...formData, admissionDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admission Number
                    </label>
                    <Input
                      value={formData.admissionNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, admissionNumber: e.target.value })
                      }
                      placeholder="ADM001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PEN Number
                    </label>
                    <Input
                      value={formData.penNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, penNumber: e.target.value })
                      }
                      placeholder="PEN Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Aadhar Number
                    </label>
                    <Input
                      value={formData.aadharNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, aadharNumber: e.target.value })
                      }
                      placeholder="Aadhar Number"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admission Form Number
                    </label>
                    <Input
                      value={formData.admissionFormNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, admissionFormNumber: e.target.value })
                      }
                      placeholder="Admission Form Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact No
                    </label>
                    <Input
                      type="tel"
                      value={formData.contactNo}
                      onChange={(e) =>
                        setFormData({ ...formData, contactNo: e.target.value })
                      }
                      placeholder="Contact Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      WhatsApp No
                    </label>
                    <Input
                      type="tel"
                      value={formData.whatsappNo}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsappNo: e.target.value })
                      }
                      placeholder="WhatsApp Number"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Academic Details Section */}
            <Collapsible className="border rounded-lg p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-semibold text-gray-700">Academic Details</span>
                <FiChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Roll Number
                    </label>
                    <Input
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value })
                      }
                      placeholder="001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Previous Class
                    </label>
                    <Input
                      value={formData.previousClass}
                      onChange={(e) =>
                        setFormData({ ...formData, previousClass: e.target.value })
                      }
                      placeholder="Previous Class"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Previous School Name
                    </label>
                    <Input
                      value={formData.previousSchoolName}
                      onChange={(e) =>
                        setFormData({ ...formData, previousSchoolName: e.target.value })
                      }
                      placeholder="Previous School Name"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Parent/Guardian Details Section */}
            <Collapsible className="border rounded-lg p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-semibold text-gray-700">Parent/Guardian Details</span>
                <FiChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father Name
                    </label>
                    <Input
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      placeholder="Father Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father Contact
                    </label>
                    <Input
                      type="tel"
                      value={formData.fatherContactNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherContactNumber: e.target.value })
                      }
                      placeholder="Father Contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mother Name
                    </label>
                    <Input
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      placeholder="Mother Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mother Contact
                    </label>
                    <Input
                      type="tel"
                      value={formData.motherContactNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, motherContactNumber: e.target.value })
                      }
                      placeholder="Mother Contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Guardian Name
                    </label>
                    <Input
                      value={formData.guardianName}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianName: e.target.value })
                      }
                      placeholder="Guardian Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Guardian Contact
                    </label>
                    <Input
                      type="tel"
                      value={formData.guardianMobile}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianMobile: e.target.value })
                      }
                      placeholder="Guardian Contact"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Route & Transport Section */}
            <Collapsible className="border rounded-lg p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-semibold text-gray-700">Route & Transport</span>
                <FiChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Route
                    </label>
                    <Select
                      value={formData.routeId || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, routeId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.length > 0 ? (
                          routes.map((route) => (
                            <SelectItem key={route.id} value={route.id.toString()}>
                              {route.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No routes available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bus Fee Structure (Route Plan)
                    </label>
                    <Select
                      value={formData.busFeeStructureId || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, busFeeStructureId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bus fee structure" />
                      </SelectTrigger>
                      <SelectContent>
                        {busFeeStructures.length > 0 ? (
                          busFeeStructures.map((fs) => (
                            <SelectItem key={fs.id} value={fs.id.toString()}>
                              {fs.name} - ₹{fs.amount}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No bus fee structures available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bus Number
                    </label>
                    <Input
                      value={formData.busNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, busNumber: e.target.value })
                      }
                      placeholder="Bus Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bus Seat Number
                    </label>
                    <Input
                      value={formData.busSeatNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, busSeatNumber: e.target.value })
                      }
                      placeholder="Seat Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Shift
                    </label>
                    <Select
                      value={formData.shift}
                      onValueChange={(value) =>
                        setFormData({ ...formData, shift: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Fee & Financial Section */}
            <Collapsible className="border rounded-lg p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-semibold text-gray-700">Fee & Financial Details</span>
                <FiChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category Head
                    </label>
                    <Select
                      value={formData.categoryHeadId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoryHeadId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category head" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryHeads.length > 0 ? (
                          categoryHeads.map((categoryHead) => (
                            <SelectItem
                              key={categoryHead.id}
                              value={categoryHead.id.toString()}
                            >
                              {categoryHead.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No category heads available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Opening Balance
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.openingBalance}
                      onChange={(e) =>
                        setFormData({ ...formData, openingBalance: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="Bank name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Branch Name
                    </label>
                    <Input
                      value={formData.branchName}
                      onChange={(e) =>
                        setFormData({ ...formData, branchName: e.target.value })
                      }
                      placeholder="Branch name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <Input
                      value={formData.bankIfsc}
                      onChange={(e) =>
                        setFormData({ ...formData, bankIfsc: e.target.value })
                      }
                      placeholder="IFSC code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Account No
                    </label>
                    <Input
                      value={formData.bankAccountNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, bankAccountNumber: e.target.value })
                      }
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isSibling === "yes"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isSibling: e.target.checked ? "yes" : "no",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Is Sibling
                      </span>
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Photos Section */}
            <Collapsible className="border rounded-lg p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-semibold text-gray-700">Photos & Documents</span>
                <FiChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student Photo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {formData.photoUrl || formData.photoFile ? (
                        <div className="space-y-2">
                          <img
                            src={photoPreviewUrl || formData.photoUrl || ""}
                            alt="Student photo"
                            className="w-32 h-32 mx-auto rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                photoFile: null,
                                photoUrl: "",
                              });
                            }}
                          >
                            Remove Photo
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Click to upload or drag and drop
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData({ ...formData, photoFile: file });
                              }
                            }}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("photo-upload")?.click()
                            }
                          >
                            Select Photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        {false && currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              Father/Guardian Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent/Guardian Name
                </label>
                <Input
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                  placeholder="John Doe Sr."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Relation
                </label>
                <Select
                  value={formData.parentRelation}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentRelation: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Email
                </label>
                <Input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, parentEmail: e.target.value })
                  }
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Phone
                </label>
                <Input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Route and Other Details */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              Route and Other Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Route *
                </label>
                <Select
                  value={formData.routeId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, routeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.length > 0 ? (
                      routes.map((route) => (
                        <SelectItem key={route.id} value={route.id.toString()}>
                          {route.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No routes available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Bus
                </label>
                <Input
                  value={formData.busNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, busNumber: e.target.value })
                  }
                  placeholder="Bus Number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bus Seat No
                </label>
                <Input
                  value={formData.busSeatNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, busSeatNumber: e.target.value })
                  }
                  placeholder="Seat Number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Shift
                </label>
                <Select
                  value={formData.shift}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shift: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Head *
                </label>
                <Select
                  value={formData.categoryHeadId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryHeadId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category head" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryHeads.length > 0 ? (
                      categoryHeads.map((categoryHead) => (
                        <SelectItem
                          key={categoryHead.id}
                          value={categoryHead.id.toString()}
                        >
                          {categoryHead.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No category heads available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opening Balance
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, openingBalance: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isSibling === "yes"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isSibling: e.target.checked ? "yes" : "no",
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Is Sibling
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Name
                </label>
                <Input
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="Bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch Name
                </label>
                <Input
                  value={formData.branchName}
                  onChange={(e) =>
                    setFormData({ ...formData, branchName: e.target.value })
                  }
                  placeholder="Branch name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  IFSC Code
                </label>
                <Input
                  value={formData.bankIfsc}
                  onChange={(e) =>
                    setFormData({ ...formData, bankIfsc: e.target.value })
                  }
                  placeholder="IFSC code"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Account No
                </label>
                <Input
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccountNumber: e.target.value,
                    })
                  }
                  placeholder="Account number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Photos and Attachments */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Student Photo</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {formData.photoUrl || formData.photoFile ? (
                  <div className="space-y-2">
                    <img
                      src={photoPreviewUrl || formData.photoUrl || ""}
                      alt="Student photo"
                      className="w-32 h-32 mx-auto rounded-full object-cover"
                      onError={(e) => {
                        // Failed to load photo image
                        e.currentTarget.src = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          photoFile: null,
                          photoUrl: "",
                        });
                      }}
                    >
                      Remove Photo
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, photoFile: file });
                        }
                      }}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("photo-upload")?.click()
                      }
                    >
                      Select Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <div className="border-t p-4 flex justify-between items-center">
        <div>
          {!editingStudent && (
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={savingDraft}
            >
              <FiSave className="w-4 h-4 mr-2" />
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <FiChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Next
              <FiChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
            >
              {loading
                ? "Saving..."
                : editingStudent
                ? "Update Student"
                : "Create Student"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  // Render as full page or modal based on route
  if (isFullPageMode) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {cardContent}
    </div>
  );
}
