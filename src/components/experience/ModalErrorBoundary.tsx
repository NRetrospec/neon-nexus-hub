import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * ModalErrorBoundary — keeps one broken embedded page from taking down the
 * whole dashboard. A HoloModal renders an entire page (with its own queries)
 * inside the hub; if that page throws during render, React unmounts the tree
 * up to the nearest boundary. Without one, that's the entire dashboard going
 * blank — including the sidebar the user needs to get out.
 */
interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ModalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[holo-modal] embedded page crashed:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="p-6 sm:p-10">
        <div
          className="max-w-lg mx-auto rounded-2xl border border-white/[0.08] p-6 text-center"
          style={{
            background:
              "linear-gradient(160deg, hsl(248 26% 9% / 0.9) 0%, hsl(252 32% 5% / 0.95) 100%)",
          }}
        >
          <AlertTriangle className="h-7 w-7 text-primary mx-auto mb-3" />
          <h3 className="font-gaming font-bold text-base text-foreground mb-1.5">
            {this.props.title} hit a snag
          </h3>
          <p className="font-cyber text-sm text-muted-foreground mb-4">
            The panel couldn't load. This is usually a transient connection issue — try
            again, or open it as a full page.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-3.5 py-2 rounded-lg font-cyber text-xs text-primary border border-primary/40 hover:bg-primary/10 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={this.props.onClose}
              className="px-3.5 py-2 rounded-lg font-cyber text-xs text-muted-foreground border border-white/[0.07] hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-left font-cyber text-[10px] text-muted-foreground/70 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ModalErrorBoundary;
