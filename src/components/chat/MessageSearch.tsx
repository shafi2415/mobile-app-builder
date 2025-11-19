import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, X, Calendar as CalendarIcon, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface MessageSearchProps {
  onSearch: (results: any[]) => void;
  onClear: () => void;
}

export const MessageSearch = ({ onSearch, onClear }: MessageSearchProps) => {
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("admin_approved", true)
      .order("full_name");

    if (data) setUsers(data);
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      let query = supabase
        .from("chat_messages")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (searchText) {
        query = query.ilike("message", `%${searchText}%`);
      }

      if (selectedUser) {
        query = query.eq("user_id", selectedUser);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      onSearch(data || []);
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSearchText("");
    setSelectedUser("");
    setDateFrom(undefined);
    setDateTo(undefined);
    onClear();
  };

  const hasFilters = searchText || selectedUser || dateFrom || dateTo;

  return (
    <div className="p-4 border-b bg-muted/30 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search messages..."
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Label>Filter by User</Label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full mt-2 p-2 border rounded-md"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div>
                <Label>From Date</Label>
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  className="mt-2"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} disabled={searching}>
          Search
        </Button>

        {hasFilters && (
          <Button variant="outline" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex gap-2 flex-wrap text-xs">
          {searchText && (
            <span className="bg-primary/10 px-2 py-1 rounded">
              Text: "{searchText}"
            </span>
          )}
          {selectedUser && (
            <span className="bg-primary/10 px-2 py-1 rounded">
              User: {users.find((u) => u.id === selectedUser)?.full_name}
            </span>
          )}
          {dateFrom && (
            <span className="bg-primary/10 px-2 py-1 rounded">
              From: {format(dateFrom, "MMM dd, yyyy")}
            </span>
          )}
          {dateTo && (
            <span className="bg-primary/10 px-2 py-1 rounded">
              To: {format(dateTo, "MMM dd, yyyy")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};