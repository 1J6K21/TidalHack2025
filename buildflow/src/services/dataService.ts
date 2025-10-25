import {
  AppMode,
  Manual,
  Step,
  Material,
  GenerateManualResponse,
} from "../types";
import { firebaseService } from "./firebaseService";
import { manualGenerationService } from "./manualGenerationService";

// ============================================================================
// DATA SERVICE - MODE-SPECIFIC DATA LOADING
// ============================================================================

export class DataService {
  /**
   * Load manuals based on current app mode
   */
  static async loadManuals(mode: AppMode): Promise<Manual[]> {
    if (mode === AppMode.DEMO) {
      return this.loadDemoManuals();
    } else {
      return this.loadUserManuals();
    }
  }

  /**
   * Load demo manuals from Firebase Cloud Storage
   */
  private static async loadDemoManuals(): Promise<Manual[]> {
    console.log("🔍 Loading demo manuals...");

    // For now, always use fallback data since Firebase is not fully configured
    // In a real implementation, this would try Firebase first
    const fallbackManuals: Manual[] = [
      {
        id: "keyboard",
        productName: "Custom Mechanical Keyboard",
        thumbnailURL:
          "gs://mannyai-d0b04.firebasestorage.app/images/thumbnails/keyboard.jpg",
        firebaseManualPath: "manuals/demo/keyboard",
        firebaseImagePath: "manuals/demo/keyboard/images",
        createdAt: new Date("2024-01-15T10:30:00.000Z"),
        totalPrice: 189.99,
        stepCount: 8,
      },
      {
        id: "lamp",
        productName: "Modern Table Lamp",
        thumbnailURL:
          "gs://mannyai-d0b04.firebasestorage.app/images/thumbnails/lamp.jpg",
        firebaseManualPath: "manuals/demo/lamp",
        firebaseImagePath: "manuals/demo/lamp/images",
        createdAt: new Date("2024-01-16T14:20:00.000Z"),
        totalPrice: 45.5,
        stepCount: 5,
      },
      {
        id: "TAMU_logo",
        productName: "TAMU Logo Project",
        thumbnailURL:
          "gs://mannyai-d0b04.firebasestorage.app/images/thumbnails/TAMU_logo.jpg",
        firebaseManualPath: "manuals/demo/TAMU_logo",
        firebaseImagePath: "manuals/demo/TAMU_logo/images",
        createdAt: new Date("2024-01-17T14:20:00.000Z"),
        totalPrice: 75.0,
        stepCount: 6,
      },
    ];

    console.log(
      "✅ Loaded demo manuals:",
      fallbackManuals.map((m) => ({ id: m.id, name: m.productName }))
    );
    return fallbackManuals;
  }

  /**
   * Load user-generated manuals (for live mode)
   */
  private static async loadUserManuals(): Promise<Manual[]> {
    try {
      // In live mode, we would fetch user's generated manuals
      // For now, return empty array as users haven't generated any yet
      return [];
    } catch (error) {
      console.error("Error loading user manuals:", error);
      throw new Error("Failed to load user manuals");
    }
  }

  /**
   * Load manual data (steps and materials) based on mode
   */
  static async loadManualData(
    manual: Manual,
    mode: AppMode
  ): Promise<{ steps: Step[]; materials: Material[] }> {
    if (mode === AppMode.DEMO) {
      return this.loadDemoManualData(manual);
    } else {
      return this.loadGeneratedManualData(manual);
    }
  }

  /**
   * Load demo manual data from Firebase
   */
  private static async loadDemoManualData(
    manual: Manual
  ): Promise<{ steps: Step[]; materials: Material[] }> {
    console.log("🔍 Loading demo manual data for:", manual.id);

    // For now, always use fallback data since Firebase is not fully configured
    // In a real implementation, this would try Firebase first
    const data = this.getFallbackDemoData(manual.id);

    console.log("✅ Loaded demo manual data:", {
      manualId: manual.id,
      stepsCount: data.steps.length,
      materialsCount: data.materials.length,
    });

    return data;
  }

  /**
   * Load generated manual data from Firebase
   */
  private static async loadGeneratedManualData(
    manual: Manual
  ): Promise<{ steps: Step[]; materials: Material[] }> {
    try {
      const steps = await firebaseService.getSteps(manual.firebaseManualPath);
      const materials = await firebaseService.getMaterials(
        manual.firebaseManualPath
      );

      return { steps, materials };
    } catch (error) {
      console.error("Error loading generated manual data:", error);
      throw new Error("Failed to load manual data");
    }
  }

  /**
   * Generate new manual using AI (live mode only)
   */
  static async generateManual(
    productIdea: string,
    mode: AppMode
  ): Promise<GenerateManualResponse> {
    if (mode === AppMode.DEMO) {
      throw new Error("Manual generation is disabled in demo mode");
    }

    try {
      return await manualGenerationService.generateManual({
        productIdea,
        userId: "testuser", // In real app, this would come from auth
      });
    } catch (error) {
      console.error("Error generating manual:", error);
      throw new Error("Failed to generate manual");
    }
  }

  /**
   * Get fallback demo data when Firebase fails
   */
  private static getFallbackDemoData(manualId: string): {
    steps: Step[];
    materials: Material[];
  } {
    if (manualId === "keyboard-build-2024" || manualId === "keyboard") {
      return {
        steps: [
          {
            stepNumber: 1,
            title: "Prepare the PCB",
            description:
              "Unpack the PCB and inspect for any damage. Clean the surface with isopropyl alcohol.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/keyboard/images/steps/step-1.jpg",
            estimatedTime: 15,
            tools: ["Isopropyl alcohol", "Lint-free cloth"],
            notes: "Handle the PCB carefully to avoid static damage",
          },
          {
            stepNumber: 2,
            title: "Install Switches",
            description:
              "Insert mechanical switches into the PCB. Ensure they click into place securely.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/keyboard/images/steps/step-2.jpg",
            estimatedTime: 30,
            tools: ["Mechanical switches"],
            notes: "Test each switch before final installation",
          },
        ],
        materials: [
          {
            id: "pcb-60-percent",
            name: "60% Mechanical Keyboard PCB",
            description: "Hot-swappable PCB with USB-C connector",
            quantity: 1,
            unitPrice: 45.99,
            totalPrice: 45.99,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/keyboard/images/materials/pcb.jpg",
            amazonURL:
              "https://www.amazon.com/s?k=mechanical+keyboard+pcb&ref=nb_sb_noss",
            category: "Electronics",
          },
          {
            id: "switches-cherry-mx",
            name: "Cherry MX Blue Switches",
            description: "Tactile mechanical switches with audible click",
            quantity: 61,
            unitPrice: 0.75,
            totalPrice: 45.75,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/keyboard/images/materials/switches.jpg",
            amazonURL:
              "https://www.amazon.com/s?k=cherry+mx+switches&ref=nb_sb_noss",
            category: "Electronics",
          },
        ],
      };
    }

    if (manualId === "lamp-build-2024" || manualId === "lamp") {
      return {
        steps: [
          {
            stepNumber: 1,
            title: "Prepare the Base",
            description:
              "Sand the wooden base smooth and apply wood stain evenly.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/lamp/images/steps/step-1.jpg",
            estimatedTime: 20,
            tools: ["Sandpaper", "Wood stain", "Brush"],
            notes: "Work in a well-ventilated area",
          },
          {
            stepNumber: 2,
            title: "Install Wiring",
            description:
              "Thread the electrical wire through the base and connect to the socket.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/lamp/images/steps/step-2.jpg",
            estimatedTime: 25,
            tools: ["Wire strippers", "Screwdriver"],
            notes: "Ensure power is disconnected during wiring",
          },
        ],
        materials: [
          {
            id: "wood-base",
            name: "Wooden Lamp Base",
            description: "Pre-cut wooden base for table lamp",
            quantity: 1,
            unitPrice: 15.99,
            totalPrice: 15.99,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/lamp/images/materials/wood-base.jpg",
            amazonURL:
              "https://www.amazon.com/s?k=wooden+lamp+base&ref=nb_sb_noss",
            category: "Wood",
          },
          {
            id: "lamp-socket",
            name: "E26 Lamp Socket",
            description: "Standard screw-in lamp socket with switch",
            quantity: 1,
            unitPrice: 8.5,
            totalPrice: 8.5,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/lamp/images/materials/socket.jpg",
            amazonURL:
              "https://www.amazon.com/s?k=lamp+socket+e26&ref=nb_sb_noss",
            category: "Electronics",
          },
        ],
      };
    }

    if (manualId === "TAMU_logo") {
      return {
        steps: [
          {
            stepNumber: 1,
            title: "Design the Logo Layout",
            description:
              "Create the TAMU logo design using vector graphics software and prepare for cutting.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/TAMU_logo/images/steps/step-1.jpg",
            estimatedTime: 30,
            tools: ["Computer", "Design software", "Printer"],
            notes: "Ensure logo proportions are accurate",
          },
          {
            stepNumber: 2,
            title: "Cut the Base Material",
            description:
              "Cut the wooden base to the required dimensions for the logo display.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/TAMU_logo/images/steps/step-2.jpg",
            estimatedTime: 25,
            tools: ["Saw", "Sandpaper", "Measuring tape"],
            notes: "Sand all edges smooth",
          },
          {
            stepNumber: 3,
            title: "Apply Logo Design",
            description:
              "Transfer the TAMU logo design to the base material using stencils or vinyl.",
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/TAMU_logo/images/steps/step-3.jpg",
            estimatedTime: 40,
            tools: ["Stencils", "Paint", "Brushes"],
            notes: "Use official TAMU colors: maroon and white",
          },
        ],
        materials: [
          {
            id: "wood-base-tamu",
            name: "Wooden Display Base",
            description: "High-quality wood base for logo display",
            quantity: 1,
            unitPrice: 25.99,
            totalPrice: 25.99,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/TAMU_logo/images/materials/5198MshnbaL._AC_SL1000_.jpg",
            amazonURL:
              "https://www.amazon.com/s?k=wooden+display+base&ref=nb_sb_noss",
            category: "Wood",
          },
          {
            id: "maroon-paint",
            name: "Maroon Paint",
            description: "Official TAMU maroon color paint",
            quantity: 1,
            unitPrice: 12.99,
            totalPrice: 12.99,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/TAMU_logo/images/materials/maroon-paint.jpg",
            amazonURL: "https://www.amazon.com/s?k=maroon+paint&ref=nb_sb_noss",
            category: "Paint",
          },
          {
            id: "white-paint",
            name: "White Paint",
            description: "High-quality white paint for logo details",
            quantity: 1,
            unitPrice: 9.99,
            totalPrice: 9.99,
            imageURL:
              "gs://mannyai-d0b04.firebasestorage.app/manuals/demo/TAMU_logo/images/materials/white-paint.jpg",
            amazonURL: "https://www.amazon.com/s?k=white+paint&ref=nb_sb_noss",
            category: "Paint",
          },
        ],
      };
    }

    // Default fallback
    return {
      steps: [],
      materials: [],
    };
  }
}

export const dataService = DataService;
