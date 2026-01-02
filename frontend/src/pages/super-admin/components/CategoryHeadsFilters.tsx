import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School } from "../../../services/schoolService";

interface CategoryHeadsFiltersProps {
  selectedSchoolId: string | number;
  setSelectedSchoolId: (schoolId: string | number) => void;
  schools: School[];
  setPage: (page: number) => void;
}

export default function CategoryHeadsFilters({
  selectedSchoolId,
  setSelectedSchoolId,
  schools,
  setPage,
}: CategoryHeadsFiltersProps) {
  return (
    <div className="mb-4">
      <Select
        value={selectedSchoolId ? selectedSchoolId.toString() : "__EMPTY__"}
        onValueChange={(value) => {
          setSelectedSchoolId(value === "__EMPTY__" ? "" : parseInt(value));
          setPage(1);
        }}
      >
        <SelectTrigger className="w-full max-w-xs">
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
  );
}

