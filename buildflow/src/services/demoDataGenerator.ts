import { GenerateManualResponse, Step, Material } from '../types';

// Demo data templates for different project types
const DEMO_TEMPLATES = {
  lamp: {
    projectName: 'Modern Wooden Desk Lamp',
    estimatedTotalTime: 120,
    steps: [
      {
        stepNumber: 1,
        title: 'Prepare the wooden base',
        description: 'Cut the oak wood base to 6" x 4" x 1" dimensions using a table saw. Sand all surfaces with 220-grit sandpaper until smooth.',
        estimatedTime: 25,
        tools: ['Table saw', 'Sandpaper (220-grit)', 'Safety glasses'],
        notes: 'Always wear safety glasses when using power tools. Check wood grain direction before cutting.'
      },
      {
        stepNumber: 2,
        title: 'Drill cord hole',
        description: 'Mark and drill a 1/2" hole through the back of the base for the power cord. Use a drill press for clean, straight holes.',
        estimatedTime: 15,
        tools: ['Drill press', '1/2" drill bit', 'Clamps'],
        notes: 'Place scrap wood underneath to prevent tear-out when drilling through.'
      },
      {
        stepNumber: 3,
        title: 'Install lamp socket',
        description: 'Mount the E26 lamp socket to the top of the wooden base using the provided screws. Ensure it\'s centered and level.',
        estimatedTime: 20,
        tools: ['Screwdriver', 'Level', 'Pencil'],
        notes: 'Test fit the socket before final installation to ensure proper alignment.'
      },
      {
        stepNumber: 4,
        title: 'Wire the electrical components',
        description: 'Connect the lamp cord to the socket following electrical safety guidelines. Use wire nuts for secure connections.',
        estimatedTime: 30,
        tools: ['Wire strippers', 'Wire nuts', 'Electrical tape'],
        notes: 'Turn off power at breaker before working with electrical components. Consider hiring an electrician if unsure.'
      },
      {
        stepNumber: 5,
        title: 'Apply finish and final assembly',
        description: 'Apply wood stain or finish of choice. Allow to dry completely, then install the LED bulb and test functionality.',
        estimatedTime: 30,
        tools: ['Wood stain', 'Brush', 'Rags'],
        notes: 'Work in well-ventilated area when applying finishes. Allow 24 hours drying time.'
      }
    ],
    materials: [
      {
        id: 'oak-wood-base',
        name: 'Oak Wood Block',
        description: 'Solid oak wood block, 6" x 4" x 1", kiln-dried and ready for finishing',
        quantity: 1,
        unitPrice: 18.99,
        totalPrice: 18.99,
        category: 'Hardware'
      },
      {
        id: 'lamp-socket-e26',
        name: 'E26 Lamp Socket',
        description: 'Standard E26 screw-in lamp socket with mounting hardware',
        quantity: 1,
        unitPrice: 8.50,
        totalPrice: 8.50,
        category: 'Electronics'
      },
      {
        id: 'power-cord-6ft',
        name: '6ft Power Cord',
        description: 'UL-listed power cord with inline switch, 6 feet long',
        quantity: 1,
        unitPrice: 12.99,
        totalPrice: 12.99,
        category: 'Electronics'
      },
      {
        id: 'led-bulb-9w',
        name: '9W LED Bulb',
        description: 'Energy-efficient LED bulb, warm white (2700K), dimmable',
        quantity: 1,
        unitPrice: 7.99,
        totalPrice: 7.99,
        category: 'Electronics'
      },
      {
        id: 'wood-screws',
        name: 'Wood Screws (8-pack)',
        description: '#6 x 1" wood screws for mounting socket',
        quantity: 1,
        unitPrice: 3.49,
        totalPrice: 3.49,
        category: 'Fasteners'
      },
      {
        id: 'wood-stain',
        name: 'Wood Stain (8oz)',
        description: 'Water-based wood stain in walnut finish',
        quantity: 1,
        unitPrice: 9.99,
        totalPrice: 9.99,
        category: 'Materials'
      }
    ]
  },
  
  shelf: {
    projectName: 'Industrial Pipe Bookshelf',
    estimatedTotalTime: 180,
    steps: [
      {
        stepNumber: 1,
        title: 'Cut wooden shelves to size',
        description: 'Cut pine boards to 36" length using a miter saw. Sand all surfaces smooth with 150-grit sandpaper.',
        estimatedTime: 30,
        tools: ['Miter saw', 'Sandpaper (150-grit)', 'Measuring tape'],
        notes: 'Measure twice, cut once. Ensure all shelves are exactly the same length.'
      },
      {
        stepNumber: 2,
        title: 'Prepare pipe fittings',
        description: 'Clean all pipe fittings and apply thread sealant to threaded connections. Assemble the frame structure.',
        estimatedTime: 45,
        tools: ['Pipe wrench', 'Thread sealant', 'Clean rags'],
        notes: 'Hand-tighten first, then use wrench for final 1-2 turns to avoid over-tightening.'
      },
      {
        stepNumber: 3,
        title: 'Drill shelf mounting holes',
        description: 'Mark and drill pilot holes in shelves for pipe flanges. Use a drill bit slightly smaller than screw diameter.',
        estimatedTime: 25,
        tools: ['Drill', 'Drill bits', 'Pencil', 'Ruler'],
        notes: 'Use a center punch to prevent drill bit from wandering on the wood surface.'
      },
      {
        stepNumber: 4,
        title: 'Apply wood finish',
        description: 'Stain or paint the wooden shelves according to your preference. Allow proper drying time between coats.',
        estimatedTime: 60,
        tools: ['Wood stain/paint', 'Brushes', 'Drop cloth'],
        notes: 'Work in dust-free environment. Apply thin, even coats for best results.'
      },
      {
        stepNumber: 5,
        title: 'Final assembly',
        description: 'Attach shelves to pipe frame using flanges and screws. Check level and adjust as needed.',
        estimatedTime: 20,
        tools: ['Screwdriver', 'Level', 'Adjustable wrench'],
        notes: 'Start with middle shelf first, then work up and down for best stability.'
      }
    ],
    materials: [
      {
        id: 'pine-boards-3pack',
        name: 'Pine Boards (3-pack)',
        description: '1" x 8" x 4\' pine boards, kiln-dried and planed smooth',
        quantity: 1,
        unitPrice: 24.99,
        totalPrice: 24.99,
        category: 'Hardware'
      },
      {
        id: 'pipe-fittings-kit',
        name: 'Black Iron Pipe Kit',
        description: 'Complete kit with pipes, elbows, and flanges for 3-shelf unit',
        quantity: 1,
        unitPrice: 45.99,
        totalPrice: 45.99,
        category: 'Hardware'
      },
      {
        id: 'wood-screws-32pack',
        name: 'Wood Screws (32-pack)',
        description: '#8 x 1.5" wood screws for attaching shelves to flanges',
        quantity: 1,
        unitPrice: 6.99,
        totalPrice: 6.99,
        category: 'Fasteners'
      },
      {
        id: 'thread-sealant',
        name: 'Pipe Thread Sealant',
        description: 'PTFE thread sealant for leak-proof pipe connections',
        quantity: 1,
        unitPrice: 4.99,
        totalPrice: 4.99,
        category: 'Materials'
      },
      {
        id: 'wood-stain-dark',
        name: 'Dark Wood Stain (16oz)',
        description: 'Oil-based wood stain in dark walnut finish',
        quantity: 1,
        unitPrice: 12.99,
        totalPrice: 12.99,
        category: 'Materials'
      }
    ]
  },

  planter: {
    projectName: 'Modern Concrete Planters',
    estimatedTotalTime: 240,
    steps: [
      {
        stepNumber: 1,
        title: 'Prepare concrete molds',
        description: 'Set up inner and outer molds to create planter walls. Apply mold release agent to prevent sticking.',
        estimatedTime: 30,
        tools: ['Plastic containers', 'Mold release spray', 'Measuring cups'],
        notes: 'Choose food-grade containers for safety. Ensure molds are clean and dry before use.'
      },
      {
        stepNumber: 2,
        title: 'Mix concrete',
        description: 'Mix concrete according to package directions. Add fiber reinforcement for extra strength.',
        estimatedTime: 20,
        tools: ['Mixing bucket', 'Drill with paddle', 'Measuring tools'],
        notes: 'Work quickly once mixed. Concrete begins setting within 30 minutes.'
      },
      {
        stepNumber: 3,
        title: 'Pour and vibrate concrete',
        description: 'Pour concrete into molds, leaving space for drainage holes. Vibrate to remove air bubbles.',
        estimatedTime: 25,
        tools: ['Vibrating tool', 'Trowel', 'Gloves'],
        notes: 'Tap mold sides gently to help release air bubbles. Work systematically around the mold.'
      },
      {
        stepNumber: 4,
        title: 'Cure concrete',
        description: 'Allow concrete to cure for 24-48 hours in a humid environment. Keep covered with plastic.',
        estimatedTime: 120,
        tools: ['Plastic sheeting', 'Spray bottle'],
        notes: 'Mist occasionally to maintain moisture. Avoid direct sunlight during curing.'
      },
      {
        stepNumber: 5,
        title: 'Demold and finish',
        description: 'Carefully remove planters from molds. Sand rough edges and drill drainage holes if needed.',
        estimatedTime: 45,
        tools: ['Sandpaper', 'Drill', 'Masonry bit'],
        notes: 'Handle with care - concrete is still gaining strength. Wear dust mask when sanding.'
      }
    ],
    materials: [
      {
        id: 'concrete-mix-50lb',
        name: 'Concrete Mix (50lb)',
        description: 'High-strength concrete mix suitable for outdoor planters',
        quantity: 2,
        unitPrice: 8.99,
        totalPrice: 17.98,
        category: 'Materials'
      },
      {
        id: 'fiber-reinforcement',
        name: 'Concrete Fiber Reinforcement',
        description: 'Synthetic fibers to add tensile strength to concrete',
        quantity: 1,
        unitPrice: 12.99,
        totalPrice: 12.99,
        category: 'Materials'
      },
      {
        id: 'mold-release-spray',
        name: 'Mold Release Spray',
        description: 'Professional-grade release agent for concrete molds',
        quantity: 1,
        unitPrice: 9.99,
        totalPrice: 9.99,
        category: 'Materials'
      },
      {
        id: 'plastic-containers',
        name: 'Plastic Mold Containers',
        description: 'Set of nested containers for creating planter molds',
        quantity: 1,
        unitPrice: 15.99,
        totalPrice: 15.99,
        category: 'Tools'
      }
    ]
  }
};

/**
 * Generate demo manual data based on product idea keywords
 */
export function generateDemoManual(productIdea: string): GenerateManualResponse {
  const lowerIdea = productIdea.toLowerCase();
  
  // Determine which template to use based on keywords
  let template;
  if (lowerIdea.includes('lamp') || lowerIdea.includes('light')) {
    template = DEMO_TEMPLATES.lamp;
  } else if (lowerIdea.includes('shelf') || lowerIdea.includes('bookshelf') || lowerIdea.includes('storage')) {
    template = DEMO_TEMPLATES.shelf;
  } else if (lowerIdea.includes('planter') || lowerIdea.includes('pot') || lowerIdea.includes('concrete')) {
    template = DEMO_TEMPLATES.planter;
  } else {
    // Default to lamp template for unknown ideas
    template = DEMO_TEMPLATES.lamp;
  }

  // Generate unique manual ID
  const manualId = `demo-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate total price
  const totalPrice = template.materials.reduce((sum, material) => sum + material.totalPrice, 0);
  
  // Process steps with proper image URLs
  const steps: Step[] = template.steps.map(step => ({
    ...step,
    imageURL: `manuals/generated/${manualId}/images/steps/step-${step.stepNumber}.jpg`
  }));
  
  // Process materials with proper image URLs
  const materials: Material[] = template.materials.map(material => ({
    ...material,
    imageURL: `manuals/generated/${manualId}/images/materials/${material.id}.jpg`,
    amazonURL: `https://www.amazon.com/s?k=${encodeURIComponent(material.name)}&ref=nb_sb_noss`
  }));

  return {
    manualId,
    projectName: template.projectName,
    steps,
    materials,
    totalPrice: Math.round(totalPrice * 100) / 100,
    firebasePath: `manuals/generated/${manualId}`
  };
}

/**
 * Simulate API delay for demo mode
 */
export function simulateApiDelay(): Promise<void> {
  // Random delay between 1-3 seconds to simulate real API call
  const delay = Math.random() * 2000 + 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}