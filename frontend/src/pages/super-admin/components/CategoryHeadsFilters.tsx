import { FiSearch, FiX } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School } from "../../../services/schoolService";

interface CategoryHeadsFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  selectedSchoolId: string | number;
  setSelectedSchoolId: (schoolId: string | number) => void;
  schools: School[];
  setPage: (page: number) => void;
}

export default function CategoryHeadsFilters({
  search,
  setSearch,
  selectedSchoolId,
  setSelectedSchoolId,
  schools,
  setPage,
}: CategoryHeadsFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or description..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      <div>
        <Select
          value={selectedSchoolId ? selectedSchoolId.toString() : "__EMPTY__"}
          onValueChange={(value) => {
            setSelectedSchoolId(value === "__EMPTY__" ? "" : parseInt(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by School" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="__EMPTY__">All Schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id.toString()}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

