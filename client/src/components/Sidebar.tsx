import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { 
  LayoutDashboard, 
  Ticket, 
  BookOpen, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const baseNavItems = [
  { label: "Painel", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Chamados", icon: Ticket, href: "/tickets" },
  { label: "Base de Conhecimento", icon: BookOpen, href: "/knowledge-base" },
  { label: "Relatórios", icon: BarChart2, href: "/reports" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isAdmin } = useProfile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Add technicians link if user is admin
  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? [{ label: "Técnicos", icon: Users, href: "/technicians" }] : []),
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-foreground text-background border-r border-border">
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-sm">S</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Support<span className="text-muted-foreground">Pro</span></span>
        </div>
      </div>

      <div className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-3 mt-auto border-t border-border">
        <div className="flex items-center gap-2 mb-2 px-1">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.firstName || "User"} className="w-7 h-7 rounded-full border border-border" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border border-border">
              <span className="text-xs font-medium text-muted-foreground">
                {user?.firstName?.[0] || "U"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full justify-start text-xs h-8 border-border hover:bg-muted"
          onClick={() => logout()}
        >
          <LogOut className="w-3 h-3 mr-1.5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-2 left-2 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 shadow-sm bg-foreground border-border text-background hover:bg-muted">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-border bg-foreground">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
