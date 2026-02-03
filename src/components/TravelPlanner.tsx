import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { MapView } from '@/components/map/MapView';
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline';
import { MobileNavigation } from '@/components/mobile/MobileNavigation';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTravelStore } from '@/store/travelStore';
import { cn } from '@/lib/utils';

export function TravelPlanner() {
  const { mobileView } = useTravelStore();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Pane - Chat */}
        <div className="w-[400px] border-r flex flex-col shrink-0">
          <ErrorBoundary fallbackTitle="Chat unavailable">
            <ChatInterface />
          </ErrorBoundary>
        </div>

        {/* Right Pane - Map & Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="split" className="flex-1 flex flex-col">
            <div className="border-b px-4 py-2 bg-muted/30">
              <TabsList className="grid w-full max-w-[300px] grid-cols-3">
                <TabsTrigger value="split">Split View</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="split" className="flex-1 m-0 overflow-hidden">
              <div className="flex h-full">
                <div className="flex-1 p-4">
                  <ErrorBoundary fallbackTitle="Map unavailable">
                    <MapView />
                  </ErrorBoundary>
                </div>
                <div className="w-[350px] border-l overflow-hidden">
                  <ErrorBoundary fallbackTitle="Timeline unavailable">
                    <ItineraryTimeline />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map" className="flex-1 m-0 p-4 overflow-hidden">
              <ErrorBoundary fallbackTitle="Map unavailable">
                <MapView />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 m-0 overflow-hidden">
              <ErrorBoundary fallbackTitle="Timeline unavailable">
                <ItineraryTimeline />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex-1 md:hidden overflow-hidden pb-16">
        <div className={cn(
          "h-full transition-all duration-300",
          mobileView !== 'chat' && "hidden"
        )}>
          <ErrorBoundary fallbackTitle="Chat unavailable">
            <ChatInterface />
          </ErrorBoundary>
        </div>

        <div className={cn(
          "h-full p-4 transition-all duration-300",
          mobileView !== 'map' && "hidden"
        )}>
          <ErrorBoundary fallbackTitle="Map unavailable">
            <MapView />
          </ErrorBoundary>
        </div>

        <div className={cn(
          "h-full transition-all duration-300",
          mobileView !== 'itinerary' && "hidden"
        )}>
          <ErrorBoundary fallbackTitle="Timeline unavailable">
            <ItineraryTimeline />
          </ErrorBoundary>
        </div>

        <MobileNavigation />
      </div>
    </div>
  );
}
