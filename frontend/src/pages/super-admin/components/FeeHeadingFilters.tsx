import { FiSearch, FiX } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School } from "../../../services/schoolService";

interface FeeHeadingFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  selectedSchoolId: string | number;
  setSelectedSchoolId: (value: string | number) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  schools: School[];
  setPage: (page: number) => void;
}

export function FeeHeadingFilters({
  search,
  setSearch,
  selectedSchoolId,
  setSelectedSchoolId,
  selectedType,
  setSelectedType,
  schools,
  setPage,
}: FeeHeadingFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or description..."
          className="w-full pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-1 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </Button>
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

      <div>
        <Select
          value={selectedType || "__EMPTY__"}
          onValueChange={(value) => {
            setSelectedType(value === "__EMPTY__" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__EMPTY__">All Types</SelectItem>
            <SelectItem value="school">School Fee</SelectItem>
            <SelectItem value="transport">Transport Fee</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

