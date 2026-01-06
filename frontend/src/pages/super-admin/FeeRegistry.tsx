import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/DataTable";
import { useSchool } from "../../contexts/SchoolContext";
import { academicYearsService } from "../../services/academicYears.service";
import { paymentsService } from "../../services/payments.service";
import { studentsService } from "../../services/students.service";
import {
  invoicesService,
  CreateFeeInvoiceData,
} from "../../services/invoices.service";
import feeGenerationService from "../../services/feeGenerationService";
import { routePriceService } from "../../services/routePriceService";
import api from "../../services/api";
import { getErrorMessage } from "@/utils/errorHandling";
import { extractArrayData, extractApiData } from "@/utils/apiHelpers";
import { createInvoicePayment, prepareFeeAllocation } from "@/utils/invoicePaymentHelper";
import {
  FiLoader,
  FiSearch,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
} from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  eachMonthOfInterval,
} from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface StudentDetails {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  class?: {
    id: number;
    name: string;
  };
  classId?: number; // Add classId for direct access
  categoryHead?: {
    id: number;
    name: string;
  };
  categoryHeadId?: number; // Add categoryHeadId for direct access
  route?: {
    id: number;
    name: string;
  };
  routeId?: number;
  openingBalance?: number;
}

interface FeeBreakdown {
  feeHead: string;
  feeStructureId: number;
  monthlyAmounts: Record<string, number>; // month key -> amount
  total: number;
  received: number;
  balance: number;
}

export default function FeeRegistry() {
  const { selectedSchoolId } = useSchool();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentSearchId, setStudentSearchId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  // Payment related state
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] =
    useState<StudentFeeStructure | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amountReceived: "", // Total amount received (will be allocated to fees)
    discount: "",
    paymentMethod: "cash" as
      | "cash"
      | "bank_transfer"
      | "card"
      | "online"
      | "cheque",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionId: "",
    notes: "",
  });
  // Fee head priority selection (which fees to pay)
  const [selectedFeeHeads, setSelectedFeeHeads] = useState<Set<number>>(
    new Set()
  );
  const [paymentAllocation, setPaymentAllocation] = useState<
    Record<number, number>
  >({});
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Fetch academic years
  const { data: academicYears = [], isLoading: loadingAcademicYears } =
    useQuery({
      queryKey: ["academicYears", selectedSchoolId],
      queryFn: () =>
        academicYearsService.getAll(Number(selectedSchoolId) as number),
      enabled: !!selectedSchoolId,
    });

  // Set current academic year as default
  useEffect(() => {
    if (academicYears.length > 0 && !academicYearId) {
      const currentYear = academicYears.find((y) => y.isCurrent);
      if (currentYear) {
        setAcademicYearId(currentYear.id);
      } else {
        setAcademicYearId(academicYears[0].id);
      }
    }
  }, [academicYears, academicYearId]);

  // Search students for autocomplete
  useEffect(() => {
    if (studentSearch.length >= 2 && selectedSchoolId) {
      studentsService
        .search(selectedSchoolId as number, studentSearch)
        .then((results) => setStudents(results))
        .catch(() => setStudents([]));
    } else {
      setStudents([]);
    }
  }, [studentSearch, selectedSchoolId]);

  // Fetch generation history
  // Search student by ID or name
  const handleSearchStudent = async (preserveMessages = false) => {
    // Clear previous messages when searching (unless preserving for refresh after payment)
    if (!preserveMessages) {
      setSuccess("");
      setError("");
    }

    // Use studentSearchId if available, otherwise try to extract from studentSearch
    const searchValue = studentSearchId.trim() || studentSearch.trim();
    if (!searchValue || !selectedSchoolId || !academicYearId) {
      setError(
        "Please enter a student ID or name and ensure school and academic year are selected"
      );
      return;
    }

    setLoadingStudent(true);
    setError("");
    setStudentDetails(null);
    setFeeBreakdown([]);
    setPayments([]);
    setStudents([]); // Clear dropdown when searching

    try {
      let student: any = null;
      let studentData: any = null;
      const searchId = searchValue;

      // First, try using the studentsService.search which handles both ID and name searches
      const searchResults = await studentsService.search(
        selectedSchoolId as number,
        searchId
      );

      if (searchResults && searchResults.length > 0) {
        // If searching by exact studentId, prefer exact match
        // Otherwise, use the first result
        if (searchId.length >= 2) {
          // Try to find exact match by studentId first (case-insensitive)
          const exactMatch = searchResults.find(
            (s: any) =>
              s.studentId &&
              s.studentId.toString().trim().toLowerCase() ===
                searchId.toLowerCase()
          );

          // If no exact match and searchId is numeric, try database ID match
          if (!exactMatch && !isNaN(parseInt(searchId, 10))) {
            const numericId = parseInt(searchId, 10);
            const dbIdMatch = searchResults.find(
              (s: any) => s.id === numericId
            );
            if (dbIdMatch) {
              student = dbIdMatch;
            }
          } else if (exactMatch) {
            student = exactMatch;
          } else {
            // Use first result if no exact match (for name searches)
            student = searchResults[0];
          }
        } else {
          student = searchResults[0];
        }
      }

      // If search didn't find anything, try direct lookup by database ID if numeric
      if (!student && !isNaN(parseInt(searchId, 10))) {
        const numericId = parseInt(searchId, 10);
        try {
          const directResponse = await api.instance.get(
            `/students/${numericId}`,
            {
              params: { schoolId: selectedSchoolId },
            }
          );
          studentData =
            extractApiData<any>(directResponse) || directResponse.data;
          if (
            studentData &&
            studentData.schoolId === Number(selectedSchoolId)
          ) {
            student = { id: studentData.id, studentId: studentData.studentId };
          }
        } catch (err) {
          // Direct lookup failed, continue
          console.log("Direct lookup failed");
        }
      }

      if (!student) {
        setError(
          `Student "${searchId}" not found. Please check the student ID or name and try again.`
        );
        setStudentDetails(null);
        setFeeBreakdown([]);
        setPayments([]);
        setLoadingStudent(false);
        return;
      }

      // Get full student details with relations
      if (!studentData) {
        const studentDetailResponse = await api.instance.get(
          `/students/${student.id}`,
          {
            params: { schoolId: selectedSchoolId },
          }
        );
        studentData =
          extractApiData<any>(studentDetailResponse) ||
          studentDetailResponse.data;
      }

      if (!studentData) {
        setError(`Failed to load student details for ID "${searchId}"`);
        setLoadingStudent(false);
        return;
      }

      // Ensure we have the relations loaded - reload if needed
      if (!studentData.categoryHead && !studentData.categoryHeadId) {
        // Try to reload with relations explicitly
        try {
          const reloadResponse = await api.instance.get(
            `/students/${studentData.id}`,
            {
              params: { schoolId: selectedSchoolId },
            }
          );
          const reloadedData =
            extractApiData<any>(reloadResponse) || reloadResponse.data;
          if (reloadedData) {
            studentData = reloadedData;
          }
        } catch (err) {
          console.warn("Failed to reload student with relations:", err);
        }
      }

      // Get academic record for the academic year
      const academicRecordResponse = await api.instance.get(
        "/student-academic-records",
        {
          params: { studentId: student.id, academicYearId },
        }
      );

      const records = extractArrayData<any>(academicRecordResponse);
      const academicRecord = records.length > 0 ? records[0] : null;

      // Pre-check: Verify student has required information
      const missingFields: string[] = [];
      if (!academicRecord?.class || !academicRecord?.classId) {
        missingFields.push("Class");
      }
      // Check both categoryHead relation and categoryHeadId
      const hasCategoryHead =
        studentData.categoryHead?.id || studentData.categoryHeadId;
      if (!hasCategoryHead) {
        missingFields.push("Fee Category");
      }
      // Check both route relation and routeId
      const hasRoute = studentData.route?.id || studentData.routeId;
      if (!hasRoute) {
        missingFields.push("Route");
      }

      if (missingFields.length > 0) {
        setError(
          `Student is missing required information: ${missingFields.join(
            ", "
          )}. ` +
            `Please update the student profile first before generating fees.`
        );
        setStudentDetails(null);
        setFeeBreakdown([]);
        setLoadingStudent(false);
        return;
      }

      // Get categoryHeadId from URL parameter as fallback
      const urlCategoryHeadId = searchParams.get("categoryHeadId");
      const finalCategoryHeadId =
        studentData.categoryHeadId ||
        studentData.categoryHead?.id ||
        (urlCategoryHeadId ? parseInt(urlCategoryHeadId, 10) : undefined);

      setStudentDetails({
        id: studentData.id,
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        parentName: studentData.parentName,
        parentPhone: studentData.parentPhone,
        address: studentData.address,
        class: academicRecord?.class,
        classId: academicRecord?.classId || academicRecord?.class?.id, // Add classId for direct access
        categoryHead: studentData.categoryHead,
        categoryHeadId: finalCategoryHeadId, // Use URL parameter as fallback
        route: studentData.route,
        routeId: studentData.routeId,
        openingBalance: studentData.openingBalance || 0,
      });

      // Update URL parameters with student info
      const newParams = new URLSearchParams(searchParams);
      newParams.set("studentId", studentData.studentId);
      if (finalCategoryHeadId) {
        newParams.set("categoryHeadId", finalCategoryHeadId.toString());
      }
      if (academicYearId) {
        newParams.set("academicYearId", academicYearId.toString());
      }
      setSearchParams(newParams, { replace: true });

      // Load payments for this student
      await loadPayments(studentData.id);

      // Prepare student details object to pass to generateFeeBreakdown
      const studentDetailsForBreakdown: StudentDetails = {
        id: studentData.id,
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        parentName: studentData.parentName,
        parentPhone: studentData.parentPhone,
        address: studentData.address,
        class: academicRecord?.class,
        classId: academicRecord?.classId || academicRecord?.class?.id,
        categoryHead: studentData.categoryHead,
        categoryHeadId: finalCategoryHeadId,
        route: studentData.route,
        routeId: studentData.routeId,
        openingBalance: studentData.openingBalance || 0,
      };

      // Generate fee breakdown (will use loaded payments for accurate calculations)
      await generateFeeBreakdown(
        studentData.id,
        academicYearId,
        academicRecord?.classId,
        studentDetailsForBreakdown
      );
    } catch (err: any) {
      console.error("Error searching student:", err);
      setError(
        getErrorMessage(
          err,
          `Failed to search student: ${err.message || "Unknown error"}`
        )
      );
      setStudentDetails(null);
      setFeeBreakdown([]);
      setPayments([]);
    } finally {
      setLoadingStudent(false);
    }
  };

  // Generate fee breakdown
  const generateFeeBreakdown = async (
    studentId: number,
    academicYearId: number,
    classId?: number,
    studentData?: StudentDetails | null
  ) => {
    if (!classId || !selectedSchoolId) return;

    setLoadingBreakdown(true);
    try {
      // Get academic year details
      const academicYear = academicYears.find((y) => y.id === academicYearId);
      if (!academicYear) return;

      // Use passed studentData or fallback to state
      const currentStudentDetails = studentData || studentDetails;

      // Pre-check: Verify student has required information
      // Check both class object and classId for robustness
      const hasClass =
        currentStudentDetails?.class ||
        currentStudentDetails?.classId ||
        classId;
      if (!hasClass) {
        setError(
          "Student must have a class assigned. Please update the student profile first."
        );
        setLoadingBreakdown(false);
        return;
      }

      // Use classId from academic record if available, otherwise from studentDetails
      const effectiveClassId =
        classId ||
        currentStudentDetails?.classId ||
        currentStudentDetails?.class?.id;
      if (!effectiveClassId) {
        setError(
          "Student must have a class assigned. Please update the student profile first."
        );
        setLoadingBreakdown(false);
        return;
      }

      // Check categoryHead - use categoryHeadId if relation is not loaded
      // Also check URL parameter as fallback
      const urlCategoryHeadId = searchParams.get("categoryHeadId");
      const effectiveCategoryHeadId =
        currentStudentDetails?.categoryHeadId ||
        currentStudentDetails?.categoryHead?.id ||
        (urlCategoryHeadId ? parseInt(urlCategoryHeadId, 10) : undefined);

      console.log("[FeeRegistry] Category Head Check:", {
        categoryHeadId: currentStudentDetails?.categoryHeadId,
        categoryHead: currentStudentDetails?.categoryHead,
        urlCategoryHeadId,
        effectiveCategoryHeadId,
      });

      if (!effectiveCategoryHeadId || isNaN(effectiveCategoryHeadId)) {
        setError(
          "Student must have a fee category assigned. Please update the student profile first."
        );
        setLoadingBreakdown(false);
        return;
      }

      // Check route - use routeId if relation is not loaded
      const effectiveRouteId =
        currentStudentDetails?.routeId || currentStudentDetails?.route?.id;
      if (!effectiveRouteId) {
        setError(
          "Student must have a route assigned. Please update the student profile first."
        );
        setLoadingBreakdown(false);
        return;
      }

      const categoryHeadId = effectiveCategoryHeadId;

      // Get fee structures for the class AND category
      const feeStructuresResponse = await api.instance.get("/fee-structures", {
        params: {
          schoolId: selectedSchoolId,
          classId: effectiveClassId, // Use effectiveClassId instead of classId
          categoryHeadId, // Filter by category
          status: "active",
        },
      });

      const feeStructures = extractArrayData<any>(feeStructuresResponse);
      console.log(
        `Fee structures found for class ${effectiveClassId} and category ${categoryHeadId}:`,
        feeStructures
      );

      if (feeStructures.length === 0) {
        setError(
          `No fee structures found for class "${
            currentStudentDetails?.class?.name || effectiveClassId
          }" ` +
            `and category "${
              currentStudentDetails?.categoryHead?.name || categoryHeadId
            }". ` +
            `Please create fee plans for this class and category combination first.`
        );
        setLoadingBreakdown(false);
        return;
      }

      // Load existing invoices for this student
      let existingInvoices: any[] = [];
      try {
        const invoicesResponse = await invoicesService.getAll({
          studentId: studentId,
          schoolId: selectedSchoolId as number,
        });
        existingInvoices = Array.isArray(invoicesResponse) ? invoicesResponse : [];
      } catch (err) {
        console.warn(
          "Failed to fetch existing invoices (continuing anyway):",
          err
        );
        // Continue without existing invoices - will show balance as full amount
      }

      // Calculate months from academic year start to previous month
      const academicYearStart = new Date(academicYear.startDate);
      const previousMonth = subMonths(new Date(), 1);
      const months = eachMonthOfInterval({
        start: startOfMonth(academicYearStart),
        end: endOfMonth(previousMonth),
      });

      // Build fee breakdown
      const breakdown: FeeBreakdown[] = [];

      // Add opening balance as Ledger Balance (include if non-zero, whether positive or negative)
      // Positive = debt (student owes), Negative = credit (student has credit)
      if (
        currentStudentDetails?.openingBalance !== undefined &&
        currentStudentDetails.openingBalance !== null
      ) {
        const openingBalance = parseFloat(
          currentStudentDetails.openingBalance.toString()
        );
        if (openingBalance !== 0) {
          // Calculate received amount from invoice-based payments
          let ledgerBalanceReceived = 0;
          for (const invoice of existingInvoices) {
            if (invoice.paidAmount && invoice.paidAmount > 0 && invoice.items) {
              // Find ledger balance items in this invoice
              const ledgerItems = invoice.items.filter((item: any) => {
                // Strategy 1: Match by description containing "Ledger Balance"
                if (item.description && 
                    item.description.toLowerCase().includes('ledger balance')) {
                  return true;
                }
                // Strategy 2: Items with no sourceType/sourceId are typically ledger balance
                if (!item.sourceType && !item.sourceId) {
                  return true;
                }
                return false;
              });

              if (ledgerItems.length > 0) {
                const itemTotal = ledgerItems.reduce(
                  (sum: number, item: any) => sum + parseFloat(item.amount),
                  0
                );
                
                // Calculate proportion of invoice payment for ledger balance
                const invoiceTotal = parseFloat(invoice.totalAmount);
                const proportion = itemTotal / invoiceTotal;
                const allocatedPayment = parseFloat(invoice.paidAmount) * proportion;
                
                ledgerBalanceReceived += allocatedPayment;
              }
            }
          }

          breakdown.push({
            feeHead:
              openingBalance > 0
                ? "Ledger Balance (Outstanding)"
                : "Ledger Balance (Credit)",
            feeStructureId: 0,
            monthlyAmounts: {},
            total: openingBalance,
            received: ledgerBalanceReceived,
            balance: openingBalance - ledgerBalanceReceived,
          });
        }
      }

      // Process each fee structure
      for (const feeStructure of feeStructures) {
        // Get fee category to check applicable months
        let applicableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default to all months
        try {
          const categoryResponse = await api.instance.get(
            `/fee-categories/${feeStructure.feeCategoryId}`
          );
          const category =
            extractApiData<any>(categoryResponse) || categoryResponse.data;
          applicableMonths = category?.applicableMonths || applicableMonths;
          console.log(
            `Category for fee structure ${feeStructure.id}:`,
            category
          );
        } catch (err) {
          console.warn(
            `Failed to fetch category for fee structure ${feeStructure.id}:`,
            err
          );
          // Use default months if category fetch fails
        }

        const monthlyAmounts: Record<string, number> = {};
        let total = 0;

        // Calculate monthly amounts based on applicable months
        months.forEach((month) => {
          const monthNumber = month.getMonth() + 1; // 1-12
          if (applicableMonths.includes(monthNumber)) {
            const monthKey = format(month, "MMM yy");
            const amount = parseFloat(feeStructure.amount.toString());
            monthlyAmounts[monthKey] = amount;
            total += amount;
          }
        });

        // Calculate received from invoice-based payments (NEW WAY)
        let received = 0;
        
        // Sum amounts from invoice items where sourceType='FEE' and sourceId=feeStructureId
        for (const invoice of existingInvoices) {
          if (invoice.paidAmount && invoice.paidAmount > 0 && invoice.items) {
            // Calculate the proportion of paid amount for this fee
            const relevantItems = invoice.items.filter(
              (item: any) => 
                item.sourceType === 'FEE' && item.sourceId === feeStructure.id
            );
            
            if (relevantItems.length > 0) {
              const itemTotal = relevantItems.reduce(
                (sum: number, item: any) => sum + parseFloat(item.amount),
                0
              );
              
              // Calculate proportion of invoice payment that applies to this fee
              const invoiceTotal = parseFloat(invoice.totalAmount);
              const proportion = itemTotal / invoiceTotal;
              const allocatedPayment = parseFloat(invoice.paidAmount) * proportion;
              
              received += allocatedPayment;
            }
          }
        }

        breakdown.push({
          feeHead: feeStructure.name,
          feeStructureId: feeStructure.id,
          monthlyAmounts,
          total,
          received,
          balance: Math.max(0, total - received), // Ensure balance is never negative or -0
        });
      }

      // Find and add bus fee based on student's route, class, and category head
      if (
        currentStudentDetails?.routeId &&
        effectiveClassId &&
        effectiveCategoryHeadId
      ) {
        try {
          // Find route price by routeId, classId, and categoryHeadId
          const routePricesResponse = await routePriceService.getRoutePrices({
            schoolId: selectedSchoolId,
            routeId: currentStudentDetails.routeId,
            classId: effectiveClassId,
            categoryHeadId: effectiveCategoryHeadId,
          });

          const routePrices = Array.isArray(routePricesResponse)
            ? routePricesResponse
            : (routePricesResponse as any).data || [];

          const routePrice =
            routePrices.find(
              (rp: any) =>
                rp.routeId === currentStudentDetails.routeId &&
                rp.classId === effectiveClassId &&
                rp.categoryHeadId === effectiveCategoryHeadId
            ) || routePrices[0];

          if (routePrice) {
            // Find the actual transport fee structure for this student using route price
            let transportFeeStructureId = 0;
            let transportReceived = 0;

            // Calculate received from invoice-based payments (NEW WAY - FIRST PRIORITY)
            // This works even without transport fee structures in the database
            for (const invoice of existingInvoices) {
                  if (invoice.paidAmount && invoice.paidAmount > 0 && invoice.items) {
                    // Find transport fee items in this invoice (multiple matching strategies)
                    const transportItems = invoice.items.filter(
                      (item: any) => {
                        // Strategy 1: Match by sourceType (preferred)
                        if (item.sourceType === 'TRANSPORT') return true;
                        
                        // Strategy 2: Match by description containing "Transport" (fallback)
                        if (item.description && 
                            (item.description.toLowerCase().includes('transport') ||
                             item.description.toLowerCase().includes('bus'))) {
                          return true;
                        }
                        
                        return false;
                      }
                    );
                    
                    if (transportItems.length > 0) {
                      const itemTotal = transportItems.reduce(
                        (sum: number, item: any) => sum + parseFloat(item.amount),
                        0
                      );
                      
                      // Calculate proportion of invoice payment for transport
                      const invoiceTotal = parseFloat(invoice.totalAmount);
                      const proportion = itemTotal / invoiceTotal;
                      const allocatedPayment = parseFloat(invoice.paidAmount) * proportion;
                      
                      transportReceived += allocatedPayment;
                    }
                  }
            }

            const busFeeAmount = parseFloat(routePrice.amount.toString());
            const monthlyAmounts: Record<string, number> = {};
            let total = 0;

            // Get transport fee category to check applicable months
            // Find transport category from fee structures
            try {
              const transportFeeStructuresResponse = await api.instance.get(
                `/fee-structures/transport/by-route-price`,
                {
                  params: {
                    routeId: routePrice.routeId,
                    classId: routePrice.classId,
                    categoryHeadId: routePrice.categoryHeadId,
                    schoolId: selectedSchoolId,
                  },
                }
              );
              const transportFeeStructures = extractArrayData<any>(
                transportFeeStructuresResponse
              );

              if (
                transportFeeStructures.length > 0 &&
                transportFeeStructures[0].category
              ) {
                const transportCategory = transportFeeStructures[0].category;
                const applicableMonths =
                  transportCategory?.applicableMonths || [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                  ]; // Default to all months

                months.forEach((month) => {
                  const monthNumber = month.getMonth() + 1; // 1-12
                  if (applicableMonths.includes(monthNumber)) {
                    const monthKey = format(month, "MMM yy");
                    monthlyAmounts[monthKey] = busFeeAmount;
                    total += busFeeAmount;
                  }
                });
              } else {
                // If category fetch fails, apply to all months
                months.forEach((month) => {
                  const monthKey = format(month, "MMM yy");
                  monthlyAmounts[monthKey] = busFeeAmount;
                  total += busFeeAmount;
                });
              }
            } catch {
              // If category fetch fails, apply to all months
              months.forEach((month) => {
                const monthKey = format(month, "MMM yy");
                monthlyAmounts[monthKey] = busFeeAmount;
                total += busFeeAmount;
              });
            }

            breakdown.push({
              feeHead: "Transport Fee",
              feeStructureId: transportFeeStructureId || 0, // Use actual fee structure ID if found, otherwise 0
              routePriceId: routePrice.id, // ✅ Add routePriceId for polymorphic source
              monthlyAmounts,
              total,
              received: transportReceived,
              balance: Math.max(0, total - transportReceived), // Ensure balance is never negative or -0
            });
          }
        } catch (err) {
          console.error("Error fetching route plan:", err);
          // Continue without bus fee if route plan not found
        }
      }

      setFeeBreakdown(breakdown);
    } catch (err: any) {
      console.error("Error generating fee breakdown:", err);
      setError(getErrorMessage(err, "Failed to generate fee breakdown"));
      setFeeBreakdown([]); // Clear breakdown on error
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Load payments for a student
  const loadPayments = async (studentId: number) => {
    try {
      const paymentsData = await paymentsService.getAll(studentId);
      setPayments(paymentsData);
    } catch (err: any) {
      console.error("Error loading payments:", err);
      // Don't show error, just log it
    }
  };

  // Calculate payment allocation based on amount received and selected fee heads
  const calculatePaymentAllocation = (
    amountReceived: number,
    selectedHeads: Set<number>
  ) => {
    const allocation: Record<number, number> = {};
    let remainingAmount = amountReceived;

    // Get fees with outstanding balance, sorted by selected priority
    // Map feeStructureId to the ID used in selectedHeads (handle Transport Fee with -1, Ledger Balance with 0)
    const feesToPay = feeBreakdown
      .filter((f) => {
        if (f.balance <= 0) return false;

        // For Transport Fee with feeStructureId = 0, check if -1 is selected
        if (f.feeStructureId === 0 && f.feeHead === "Transport Fee") {
          return selectedHeads.has(-1);
        }
        // For Ledger Balance (feeStructureId = 0), check if 0 is selected
        if (
          f.feeStructureId === 0 &&
          (f.feeHead === "Ledger Balance (Outstanding)" ||
            f.feeHead === "Ledger Balance (Credit)")
        ) {
          return selectedHeads.has(0);
        }
        // For other fees, check if feeStructureId is selected
        return selectedHeads.has(f.feeStructureId);
      })
      .map((f) => {
        // Map to the ID used in selectedHeads
        const feeId =
          f.feeStructureId === 0 && f.feeHead === "Transport Fee"
            ? -1
            : f.feeStructureId;
        return { ...f, mappedFeeId: feeId };
      })
      .sort((a, b) => {
        // Sort by selection order (first selected = first priority)
        const aIndex = Array.from(selectedHeads).indexOf(a.mappedFeeId);
        const bIndex = Array.from(selectedHeads).indexOf(b.mappedFeeId);
        return aIndex - bIndex;
      });

    // Allocate amount to fees in priority order
    for (const fee of feesToPay) {
      if (remainingAmount <= 0) break;
      const allocationAmount = Math.min(remainingAmount, fee.balance);
      // Use mappedFeeId for allocation (so Transport Fee uses -1)
      allocation[fee.mappedFeeId] = allocationAmount;
      remainingAmount -= allocationAmount;
    }

    return { allocation, remainingAmount };
  };

  // Recalculate allocation function
  const recalculateAllocation = useCallback(() => {
    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    const discount = parseFloat(paymentFormData.discount) || 0;
    const netAmount = Math.max(0, amountReceived - discount);

    if (netAmount > 0 && selectedFeeHeads.size > 0 && feeBreakdown.length > 0) {
      const { allocation } = calculatePaymentAllocation(
        netAmount,
        selectedFeeHeads
      );
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  }, [
    paymentFormData.amountReceived,
    paymentFormData.discount,
    selectedFeeHeads,
    feeBreakdown,
  ]);

  // Recalculate when dependencies change
  useEffect(() => {
    recalculateAllocation();
  }, [recalculateAllocation]);

  // Handle amount received change
  const handleAmountReceivedChange = (value: string) => {
    const newFormData = { ...paymentFormData, amountReceived: value };
    setPaymentFormData(newFormData);

    // Recalculate immediately with new value
    const amount = parseFloat(value) || 0;
    const discount = parseFloat(newFormData.discount) || 0;
    const netAmount = Math.max(0, amount - discount);

    if (netAmount > 0 && selectedFeeHeads.size > 0 && feeBreakdown.length > 0) {
      const { allocation } = calculatePaymentAllocation(
        netAmount,
        selectedFeeHeads
      );
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  };

  // Handle discount change
  const handleDiscountChange = (value: string) => {
    const newFormData = { ...paymentFormData, discount: value };
    setPaymentFormData(newFormData);

    // Recalculate immediately with new value
    const amountReceived = parseFloat(newFormData.amountReceived) || 0;
    const discount = parseFloat(value) || 0;
    const netAmount = Math.max(0, amountReceived - discount);

    if (netAmount > 0 && selectedFeeHeads.size > 0 && feeBreakdown.length > 0) {
      const { allocation } = calculatePaymentAllocation(
        netAmount,
        selectedFeeHeads
      );
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  };

  // Handle fee head selection change
  const handleFeeHeadToggle = (feeStructureId: number) => {
    const newSelected = new Set(selectedFeeHeads);
    if (newSelected.has(feeStructureId)) {
      newSelected.delete(feeStructureId);
    } else {
      newSelected.add(feeStructureId);
    }
    setSelectedFeeHeads(newSelected);

    // Recalculate allocation with discount
    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    const discount = parseFloat(paymentFormData.discount) || 0;
    const netAmount = Math.max(0, amountReceived - discount);

    if (netAmount > 0 && newSelected.size > 0) {
      const { allocation } = calculatePaymentAllocation(netAmount, newSelected);
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  };

  // Handle "Pay Now" button - open payment dialog with all fees
  const handlePayNow = () => {
    // Clear any previous success/error messages
    setSuccess("");
    setError("");

    if (!studentDetails || feeBreakdown.length === 0) {
      setError("No fees available to pay");
      return;
    }

    // Find all fees with outstanding balance (including ledger balance)
    // The balance calculation in feeBreakdown already includes invoice-based payments
    const feesWithBalance = feeBreakdown.filter((f) => {
      // Only include fees with positive balance
      if (f.balance <= 0) {
        console.log(`[Pay Now] Excluding "${f.feeHead}" - balance is ${f.balance}`);
        return false;
      }
      
      console.log(`[Pay Now] Including "${f.feeHead}" - balance is ${f.balance}`);
      return true;
    });

    if (feesWithBalance.length === 0) {
      setError("No outstanding fees to pay. All fees appear to be fully paid.");
      return;
    }

    // Default: select first fee (usually Tuition Fee, or Ledger Balance if it's first)
    const firstFee = feesWithBalance[0];
    // For ledger balance (feeStructureId = 0), use 0 as the ID
    // For Transport Fee with feeStructureId = 0, use -1
    // Otherwise use the actual feeStructureId
    const defaultFeeId =
      firstFee.feeStructureId === 0 && firstFee.feeHead === "Transport Fee"
        ? -1
        : firstFee.feeStructureId === 0
        ? 0
        : firstFee.feeStructureId;
    if (defaultFeeId !== undefined) {
      setSelectedFeeHeads(new Set([defaultFeeId]));
    }

    setSelectedFeeStructure(null); // Not needed for multi-fee payment
    setPaymentFormData({
      amountReceived: "",
      discount: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionId: "",
      notes: "",
    });
    setPaymentAllocation({});
    setShowPaymentForm(true);
  };
  // Record payment
  const handleRecordPayment = async () => {
    if (!studentDetails || !academicYearId) {
      setError("Missing required information to record payment");
      return;
    }

    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    if (isNaN(amountReceived) || amountReceived <= 0) {
      setError("Please enter a valid amount received");
      return;
    }

    // Check if using new multi-fee payment system
    if (
      selectedFeeHeads.size > 0 &&
      Object.keys(paymentAllocation).length > 0
    ) {
      // Multi-fee payment based on allocation
      const totalAllocated = Object.values(paymentAllocation).reduce(
        (sum, amt) => sum + amt,
        0
      );
      if (totalAllocated <= 0) {
        setError("Please select at least one fee head to pay");
        return;
      }

      setRecordingPayment(true);
      setError("");

      try {
        const netAmount =
          (parseFloat(paymentFormData.amountReceived) || 0) -
          (parseFloat(paymentFormData.discount) || 0);

        // Validate net amount
        if (netAmount <= 0) {
          setError(
            netAmount === 0 && parseFloat(paymentFormData.amountReceived) > 0
              ? "Discount cannot equal or exceed the amount received"
              : "Please enter an amount to pay"
          );
          setRecordingPayment(false);
          return;
        }

        // Prepare fee allocations for invoice
        // NOTE: This now INCLUDES ledger balance (feeId = 0) if present in paymentAllocation
        // Opening balance is NOT modified in the database - it remains as historical record
        // Payments against ledger balance are tracked via invoices and calculated dynamically
        const allocations = prepareFeeAllocation(
          feeBreakdown,
          selectedFeeHeads,
          paymentAllocation,
          undefined // routePriceId is now in the breakdown itself
        );

        if (allocations.length === 0) {
          setError("No valid fees selected for payment");
          setRecordingPayment(false);
          return;
        }

        // Validate schoolId is present
        if (!selectedSchoolId) {
          setError("School ID is required. Please select a school.");
          setRecordingPayment(false);
          return;
        }

        // Create invoice-based payment with full netAmount (includes ledger balance)
        const result = await createInvoicePayment({
          studentId: studentDetails.id,
          academicYearId: academicYearId,
          schoolId: selectedSchoolId,
          feeAllocations: allocations,
          totalAmount: netAmount,
          discount: parseFloat(paymentFormData.discount) || 0,
          paymentMethod: paymentFormData.paymentMethod as any,
          paymentDate: paymentFormData.paymentDate,
          transactionId: paymentFormData.transactionId,
          notes: paymentFormData.notes,
        });

        if (result.success) {
          setSuccess(
            result.message || 
            `Payment of ₹${netAmount.toFixed(2)} recorded successfully!`
          );
          setShowPaymentForm(false);
          setPaymentFormData({
            amountReceived: "",
            discount: "",
            paymentMethod: "cash",
            paymentDate: new Date().toISOString().split("T")[0],
            transactionId: "",
            notes: "",
          });
          setSelectedFeeHeads(new Set());
          setPaymentAllocation({});

          // Refresh fee breakdown (preserve success message)
          await handleSearchStudent(true);

          // Auto-clear success message after 5 seconds
          setTimeout(() => {
            setSuccess("");
          }, 5000);
        } else {
          setError(
            result.error || 
            "Failed to process payment. Please try again."
          );
        }
      } catch (err: any) {
        console.error("[Payment] Error:", err);
        setError(
          getErrorMessage(err) || 
          "An error occurred while processing payment"
        );
      } finally {
        setRecordingPayment(false);
      }
    } else {
      setError("Please select at least one fee head to pay");
    }
  };

  // handleGenerateInvoice function removed - invoices are now automatically created during payment

  // Calculate month columns
  const monthColumns = useMemo(() => {
    if (!academicYearId || academicYears.length === 0) return [];
    const academicYear = academicYears.find((y) => y.id === academicYearId);
    if (!academicYear) return [];

    const academicYearStart = new Date(academicYear.startDate);
    const previousMonth = subMonths(new Date(), 1);
    const months = eachMonthOfInterval({
      start: startOfMonth(academicYearStart),
      end: endOfMonth(previousMonth),
    });

    return months.map((month) => format(month, "MMM yy"));
  }, [academicYearId, academicYears]);

  // Calculate totals
  const totals = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    let grandTotal = 0;
    let grandReceived = 0;
    let grandBalance = 0;

    monthColumns.forEach((month) => {
      monthlyTotals[month] = 0;
    });

    feeBreakdown.forEach((fee) => {
      grandTotal += fee.total;
      grandReceived += fee.received;
      grandBalance += fee.balance;
      monthColumns.forEach((month) => {
        monthlyTotals[month] += fee.monthlyAmounts[month] || 0;
      });
    });

    // Ensure grandBalance is never negative or has floating point errors
    grandBalance = Math.max(0, Math.round(grandBalance * 100) / 100);

    return { monthlyTotals, grandTotal, grandReceived, grandBalance };
  }, [feeBreakdown, monthColumns]);

  // Payment history columns
  const paymentHistoryColumns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "receiptNumber",
        header: "Receipt Number",
        cell: ({ row }) => {
          const receipt = row.getValue("receiptNumber") as string;
          return receipt ? (
            <span className="font-mono text-sm font-semibold">{receipt}</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amount") as string);
          return (
            <span className="font-semibold text-green-600">
              ₹{amount.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => {
          const method = row.getValue("paymentMethod") as string;
          return <span className="capitalize">{method.replace("_", " ")}</span>;
        },
      },
      {
        accessorKey: "paymentDate",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Payment Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue("paymentDate") as string;
          return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
        },
      },
      {
        accessorKey: "invoice",
        header: "Fee",
        cell: ({ row }) => {
          const payment = row.original;
          
          // NEW: Invoice-based payments
          if (payment.invoice?.items && payment.invoice.items.length > 0) {
            const feeNames = payment.invoice.items
              .map((item: any) => item.description)
              .join(", ");
            return (
              <span className="text-sm" title={feeNames}>
                {payment.invoice.items.length === 1 
                  ? feeNames 
                  : `${payment.invoice.items.length} fees: ${feeNames.substring(0, 30)}${feeNames.length > 30 ? '...' : ''}`
                }
              </span>
            );
          }
          
          return <span className="text-sm text-gray-400">Unknown Fee</span>;
        },
      },
      {
        accessorKey: "transactionId",
        header: "Transaction ID",
        cell: ({ row }) => {
          const txnId = row.getValue("transactionId") as string;
          return txnId ? (
            <span className="font-mono text-xs">{txnId}</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const statusConfig = {
            completed: {
              icon: FiCheckCircle,
              color: "bg-green-100 text-green-800",
              label: "Completed",
            },
            pending: {
              icon: FiLoader,
              color: "bg-yellow-100 text-yellow-800",
              label: "Pending",
            },
            failed: {
              icon: FiXCircle,
              color: "bg-red-100 text-red-800",
              label: "Failed",
            },
            refunded: {
              icon: FiXCircle,
              color: "bg-gray-100 text-gray-800",
              label: "Refunded",
            },
          };
          const config =
            statusConfig[status as keyof typeof statusConfig] ||
            statusConfig.pending;
          const Icon = config.icon;
          return (
            <Badge className={config.color}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin/finance">Finance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Fee Registry</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Fee Registry
          </CardTitle>
          <CardDescription>
            Search student by ID and manage fee registry up to previous month
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Student</CardTitle>
          <CardDescription>
            Enter student ID to fetch details and generate fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Academic Year</Label>
              <Select
                value={academicYearId?.toString() || ""}
                onValueChange={(value) => setAcademicYearId(parseInt(value))}
                disabled={loadingAcademicYears}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} {year.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Label>Search Student</Label>
              <Input
                placeholder="Search by student ID or name..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  // Also update studentSearchId for backward compatibility
                  setStudentSearchId(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearchStudent();
                  }
                }}
              />
              {students.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setStudentSearch(
                          `${student.firstName} ${student.lastName} (${student.studentId})`
                        );
                        setStudentSearchId(student.studentId);
                        setStudents([]);
                        // Auto-search when student is selected
                        // Use setTimeout to ensure state is updated
                        setTimeout(() => {
                          handleSearchStudent();
                        }, 100);
                      }}
                    >
                      <div className="font-medium">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.studentId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSearchStudent}
              disabled={loadingStudent || !studentSearch.trim()}
            >
              {loadingStudent ? (
                <>
                  <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FiSearch className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Details */}
      {studentDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-semibold">
                  {studentDetails.firstName} {studentDetails.lastName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Father Name</Label>
                <p className="font-semibold">
                  {studentDetails.parentName || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Contact Number</Label>
                <p className="font-semibold">
                  {studentDetails.parentPhone || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Address</Label>
                <p className="font-semibold">{studentDetails.address || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Class</Label>
                <p className="font-semibold">
                  {studentDetails.class?.name || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Fee Category</Label>
                <p className="font-semibold">
                  {studentDetails.categoryHead?.name || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Route</Label>
                <p className="font-semibold">
                  {studentDetails.route?.name || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Opening Balance</Label>
                <p className="font-semibold">
                  ₹{studentDetails.openingBalance?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Breakdown Table */}
      {studentDetails && feeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
            <CardDescription>
              Monthly fee breakdown up to previous month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="flex justify-center py-8">
                <FiLoader className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Fee Head</th>
                      {monthColumns.map((month) => (
                        <th
                          key={month}
                          className="text-right p-2 font-semibold"
                        >
                          {month}
                        </th>
                      ))}
                      <th className="text-right p-2 font-semibold">Total</th>
                      <th className="text-right p-2 font-semibold">Received</th>
                      <th className="text-right p-2 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeBreakdown.map((fee, idx) => {
                      return (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">{fee.feeHead}</td>
                          {monthColumns.map((month) => (
                            <td key={month} className="text-right p-2">
                              {fee.monthlyAmounts[month]
                                ? `₹${fee.monthlyAmounts[
                                    month
                                  ].toLocaleString()}`
                                : "-"}
                            </td>
                          ))}
                          <td className="text-right p-2 font-semibold">
                            ₹{fee.total.toLocaleString()}
                          </td>
                          <td className="text-right p-2 text-green-600">
                            ₹{fee.received.toLocaleString()}
                          </td>
                          <td className="text-right p-2 text-red-600">
                            ₹{fee.balance.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 font-bold">
                      <td className="p-2">Total Amount</td>
                      {monthColumns.map((month) => (
                        <td key={month} className="text-right p-2">
                          ₹
                          {totals.monthlyTotals[month]?.toLocaleString() || "0"}
                        </td>
                      ))}
                      <td className="text-right p-2">
                        ₹{totals.grandTotal.toLocaleString()}
                      </td>
                      <td className="text-right p-2 text-green-600">
                        ₹{totals.grandReceived.toLocaleString()}
                      </td>
                      <td className="text-right p-2 text-red-600">
                        ₹{totals.grandBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handlePayNow}
                disabled={!studentDetails || feeBreakdown.length === 0 || totals.grandBalance <= 0}
                title={totals.grandBalance <= 0 ? "No outstanding fees to pay" : "Make a payment"}
              >
                <FiDollarSign className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
              
              {totals.grandBalance <= 0 && feeBreakdown.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                  <FiCheckCircle className="h-4 w-4" />
                  <span>All fees are fully paid. No outstanding balance.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form Section - Inline below fee breakdown */}
      {showPaymentForm && studentDetails && (
        <Card className="mt-4 border-2 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Record Payment</CardTitle>
                <CardDescription>
                  Enter amount received and select fee heads in order of
                  priority
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedFeeHeads(new Set());
                  setPaymentAllocation({});
                  setPaymentFormData({
                    amountReceived: "",
                    discount: "",
                    paymentMethod: "cash",
                    paymentDate: new Date().toISOString().split("T")[0],
                    transactionId: "",
                    notes: "",
                  });
                }}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Amount Received */}
              <div>
                <Label htmlFor="amountReceived">Amount Received *</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentFormData.amountReceived}
                  onChange={(e) => handleAmountReceivedChange(e.target.value)}
                  placeholder="Enter amount received"
                />
              </div>

              {/* Fee Head Priority Selection */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Fee Head Priority
                </Label>
                <p className="text-xs text-gray-500 mb-3">
                  Select fee heads in order of priority. Amounts will be
                  allocated to checked heads first.
                </p>
                <div className="space-y-2 border rounded-lg p-3">
                  {feeBreakdown
                    .filter((f) => {
                      // Filter out fees with zero or negative balance
                      if (f.balance <= 0) return false;
                      return true;
                    })
                    .map((fee) => {
                      // For Transport Fee with feeStructureId = 0, use a special identifier -1
                      // For Ledger Balance (feeStructureId = 0), use 0
                      // Otherwise use the actual feeStructureId
                      const feeId =
                        fee.feeStructureId === 0 &&
                        fee.feeHead === "Transport Fee"
                          ? -1
                          : fee.feeStructureId;
                      const isSelected = selectedFeeHeads.has(feeId);
                      const allocation = paymentAllocation[feeId] || 0;
                      const priority = isSelected
                        ? Array.from(selectedFeeHeads).indexOf(feeId) + 1
                        : null;

                      return (
                        <div
                          key={feeId}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            id={`fee-${feeId}`}
                            checked={isSelected}
                            onCheckedChange={() => handleFeeHeadToggle(feeId)}
                          />
                          <Label
                            htmlFor={`fee-${feeId}`}
                            className="flex-1 cursor-pointer flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              {priority && (
                                <Badge variant="outline" className="text-xs">
                                  Priority {priority}
                                </Badge>
                              )}
                              <span className="font-medium">{fee.feeHead}</span>
                            </span>
                            <span className="text-sm text-gray-600">
                              Balance: ₹{fee.balance.toLocaleString()}
                              {allocation > 0 && (
                                <span className="ml-2 text-green-600 font-semibold">
                                  → ₹{allocation.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Allocation Summary */}
              {(Object.keys(paymentAllocation).length > 0 ||
                paymentFormData.amountReceived ||
                paymentFormData.discount) &&
                (() => {
                  const amountReceived =
                    parseFloat(paymentFormData.amountReceived) || 0;
                  const discount = parseFloat(paymentFormData.discount) || 0;
                  const netAmount = Math.max(0, amountReceived - discount);
                  const totalAllocated = Object.values(
                    paymentAllocation
                  ).reduce((sum, amt) => sum + amt, 0);

                  return (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold mb-2">
                        Payment Allocation:
                      </p>
                      <div className="space-y-1 text-sm">
                        {amountReceived > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Amount Received:</span>
                            <span>₹{amountReceived.toLocaleString()}</span>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Discount:</span>
                            <span>- ₹{discount.toLocaleString()}</span>
                          </div>
                        )}
                        {(amountReceived > 0 || discount > 0) && (
                          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                            <span>Net Amount:</span>
                            <span>₹{netAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {Object.entries(paymentAllocation).map(
                          ([feeId, amount]) => {
                            // Handle Transport Fee with special ID -1
                            // Handle Ledger Balance with ID 0
                            const feeIdNum = Number(feeId);
                            let fee;
                            if (feeIdNum === -1) {
                              // Transport Fee uses -1, but breakdown has feeStructureId = 0
                              fee = feeBreakdown.find(
                                (f) => f.feeHead === "Transport Fee"
                              );
                            } else if (feeIdNum === 0) {
                              // Ledger Balance has feeStructureId = 0
                              fee = feeBreakdown.find(
                                (f) =>
                                  f.feeStructureId === 0 &&
                                  (f.feeHead ===
                                    "Ledger Balance (Outstanding)" ||
                                    f.feeHead === "Ledger Balance (Credit)")
                              );
                            } else {
                              fee = feeBreakdown.find(
                                (f) => f.feeStructureId === feeIdNum
                              );
                            }
                            const feeName =
                              fee?.feeHead?.trim() ||
                              (feeIdNum === -1
                                ? "Transport Fee"
                                : feeIdNum === 0
                                ? "Ledger Balance"
                                : `Fee ID ${feeId}`);
                            return (
                              <div key={feeId} className="flex justify-between">
                                <span>{feeName}:</span>
                                <span className="font-semibold">
                                  ₹{amount.toLocaleString()}
                                </span>
                              </div>
                            );
                          }
                        )}
                        {totalAllocated > 0 && (
                          <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                            <span>Total Allocated:</span>
                            <span>₹{totalAllocated.toLocaleString()}</span>
                          </div>
                        )}
                        {netAmount > totalAllocated && (
                          <div className="text-xs text-gray-500 mt-1">
                            Unallocated: ₹
                            {(netAmount - totalAllocated).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentFormData.discount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={paymentFormData.paymentMethod}
                    onValueChange={(value: any) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        paymentMethod: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      paymentDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="transactionId">
                  Transaction ID / Receipt No
                </Label>
                <Input
                  id="transactionId"
                  value={paymentFormData.transactionId}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      transactionId: e.target.value,
                    })
                  }
                  placeholder="Optional - for bank transfers, cards, receipt number, etc."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentFormData.notes}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Optional additional notes"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedFeeHeads(new Set());
                    setPaymentAllocation({});
                    setPaymentFormData({
                      amountReceived: "",
                      discount: "",
                      paymentMethod: "cash",
                      paymentDate: new Date().toISOString().split("T")[0],
                      transactionId: "",
                      notes: "",
                    });
                  }}
                  disabled={recordingPayment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordPayment}
                  disabled={recordingPayment}
                >
                  {recordingPayment ? (
                    <>
                      <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <FiDollarSign className="mr-2 h-4 w-4" />
                      Save Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {studentDetails && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Previous payments for {studentDetails.firstName}{" "}
                  {studentDetails.lastName} ({studentDetails.studentId})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiDollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No payments recorded yet</p>
              </div>
            ) : (
              <DataTable
                columns={paymentHistoryColumns}
                data={payments.filter((p) => p.status === "completed")}
                searchKey="receiptNumber"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
