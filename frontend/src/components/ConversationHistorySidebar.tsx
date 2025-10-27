import { MessageSquare, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationHistorySidebarProps {
  conversations: Array<{
    id: string;
    title: string;
    timestamp: number;
  }>;
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  isGenerating?: boolean; // Add this prop to disable interactions during generation
}

export const ConversationHistorySidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isGenerating = false,
}: ConversationHistorySidebarProps) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sidebar className="border-r border-border">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onNewConversation}
          className="w-full"
          variant="default"
          disabled={isGenerating}
          title={isGenerating ? "Cannot create new conversation during document generation" : "Start a new conversation"}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversation History</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-180px)]">
              <SidebarMenu>
                {conversations.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <div className="group relative">
                        <SidebarMenuButton
                          onClick={() => onSelectConversation(conversation.id)}
                          isActive={activeConversationId === conversation.id}
                          className="w-full justify-start pr-10"
                          disabled={isGenerating && activeConversationId !== conversation.id}
                          title={isGenerating && activeConversationId !== conversation.id ? 
                            "Cannot switch conversations during document generation" : 
                            `Switch to ${conversation.title}`}
                        >
                          <div className="flex flex-col items-start w-full overflow-hidden">
                            <span className="truncate w-full text-sm font-medium">
                              {conversation.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conversation.timestamp)}
                            </span>
                          </div>
                        </SidebarMenuButton>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          disabled={isGenerating}
                          title={isGenerating ? "Cannot delete conversations during document generation" : "Delete conversation"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
