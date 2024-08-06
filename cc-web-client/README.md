# App Directory

`app` directory - Next.js primary folder containing the application's source code. It typically includes subdirectories and files for various parts of the application, such as pages, components, styles, and configurations. The app directory serves as the entry point for the application, organizing the project's structure.

`favicon.ico` - the icon displayed in the browser tab when visiting your website. It's a small image file that represents your site and helps users identify it quickly among other open tabs. This file is usually placed in the public directory or at the root level of the project.

`global.css` - contains global styles for the application. These styles are applied universally across all components and pages, ensuring a consistent look and feel. You typically import global.css in your main application file (e.g., _app.js or _app.tsx).

`layout.tsx` - defines the layout of your application, specifying the common structure and design elements that should appear on multiple pages. This can include elements like the header, footer, navigation menu, and any other components that should be consistent across different pages. In Next.js, layouts help maintain a uniform structure across your site.

`page.tsx` - represents a specific page within your Next.js application. Each page file corresponds to a route in your application. For example, index.tsx typically represents the homepage, while other page files represent different routes or sections of your site. The page.tsx file contains the React component that renders the content for that particular page.

# Testing

`npm run dev` will start development server on port 3000.