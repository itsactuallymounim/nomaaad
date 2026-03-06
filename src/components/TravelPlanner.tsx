import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { LeafletMap } from '@/components/map/LeafletMap';
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
        <div className="w-[420px] border-r border-border/40 flex flex-col shrink-0">
          <ErrorBoundary fallbackTitle="Chat unavailable">
            <ChatInterface />
          </ErrorBoundary>
        </div>

        {/* Right Pane - Map & Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="split" className="flex-1 flex flex-col">
            <div className="border-b border-border/40 px-4 py-2.5 bg-muted/20 backdrop-blur-sm">
              <TabsList className="grid w-full max-w-[320px] grid-cols-3 rounded-2xl h-9">
                <TabsTrigger value="split" className="rounded-xl text-xs">Split View</TabsTrigger>
                <TabsTrigger value="map" className="rounded-xl text-xs">Map</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-xl text-xs">Timeline</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="split" className="flex-1 m-0 overflow-hidden">
              <div className="flex h-full">
                <div className="flex-1 p-4 min-h-0">
                  <div className="rounded-2xl overflow-hidden h-full border border-border/30 shadow-sm">
                    <ErrorBoundary fallbackTitle="Map unavailable">
                      <LeafletMap />
                    </ErrorBoundary>
                  </div>
                </div>
                <div className="w-[360px] border-l border-border/40 flex flex-col min-h-0 overflow-y-auto">
                  <ErrorBoundary fallbackTitle="Timeline unavailable">
                    <ItineraryTimeline />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map" className="flex-1 m-0 p-4 overflow-hidden">
              <div className="rounded-2xl overflow-hidden h-full border border-border/30 shadow-sm">
                <ErrorBoundary fallbackTitle="Map unavailable">
                  <LeafletMap />
                </ErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 m-0 overflow-y-auto">
              <ErrorBoundary fallbackTitle="Timeline unavailable">
                <ItineraryTimeline />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex-1 md:hidden overflow-hidden pb-16">
        <div className={cn("h-full transition-all duration-300", mobileView !== 'chat' && "hidden")}>
          <ErrorBoundary fallbackTitle="Chat unavailable">
            <ChatInterface />
          </ErrorBoundary>
        </div>

        <div className={cn("h-full p-3 transition-all duration-300", mobileView !== 'map' && "hidden")}>
          <div className="rounded-2xl overflow-hidden h-full border border-border/30">
            <ErrorBoundary fallbackTitle="Map unavailable">
              <LeafletMap />
            </ErrorBoundary>
          </div>
        </div>

        <div className={cn("h-full transition-all duration-300", mobileView !== 'itinerary' && "hidden")}>
          <ErrorBoundary fallbackTitle="Timeline unavailable">
            <ItineraryTimeline />
          </ErrorBoundary>
        </div>

        <MobileNavigation />
      </div>
    </div>
  );
}
