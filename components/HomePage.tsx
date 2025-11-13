
import React from 'react';
import { SparklesIcon, TableCellsIcon, CalendarDaysIcon, DocumentTextIcon, UsersIcon, PencilSquareIcon } from './icons/Icons.tsx';
import { HomepageContent } from '../types';

interface HomePageProps {
  onGetStartedClick: () => void;
  homepageContent: HomepageContent[];
}

const FeatureCard: React.FC<{ icon: React.ReactElement, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-card-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const HomePage: React.FC<HomePageProps> = ({ onGetStartedClick, homepageContent }) => {
  return (
    <div className="space-y-16 md:space-y-24 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center pt-8 md:pt-16">
        <div className="inline-block bg-primary/10 text-primary font-semibold px-4 py-1.5 rounded-full text-sm mb-4">
          The All-in-One Classroom Solution
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight">
          The Smartest Way to <br/> Manage Your Classroom
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-foreground-muted">
          From seating charts to AI-powered group generators, our suite of tools is designed to save you time, reduce administrative work, and let you focus on what matters most: teaching.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <button 
            onClick={onGetStartedClick}
            className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all transform hover:scale-105"
          >
            Get Started for Free
          </button>
        </div>
      </section>
      
      {/* Dynamic Content Section */}
      {homepageContent.length > 0 && (
          <section className="space-y-8 max-w-4xl mx-auto">
              {homepageContent.sort((a,b) => a.order - b.order).map(item => (
                  <div key={item.id} className="bg-card p-6 rounded-2xl shadow-lg shadow-black/5 border border-border">
                      {item.type === 'image' ? (
                          <img src={item.content} alt="Homepage content" className="rounded-lg w-full object-cover"/>
                      ) : (
                          <p className="text-foreground-muted whitespace-pre-wrap">{item.content}</p>
                      )}
                  </div>
              ))}
          </section>
      )}

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything You Need, All in One Place</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            A comprehensive toolkit built for the modern teacher, enhanced with powerful AI.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<SparklesIcon className="w-6 h-6" />} 
            title="AI Group Generator" 
            description="Create balanced student groups in seconds. Provide instructions like 'separate Alice and Bob' or 'mix academic levels', and let our AI handle the rest." 
          />
          <FeatureCard 
            icon={<TableCellsIcon className="w-6 h-6" />} 
            title="Dynamic Seating Charts" 
            description="Design, save, and load multiple classroom layouts with an intuitive drag-and-drop editor. Randomize seating with one click." 
          />
          <FeatureCard 
            icon={<CalendarDaysIcon className="w-6 h-6" />} 
            title="Weekly Lesson Planner" 
            description="Organize your week with a clear, visual planner. Get creative lesson ideas from our AI assistant when you need inspiration." 
          />
           <FeatureCard 
            icon={<DocumentTextIcon className="w-6 h-6" />} 
            title="Intelligent Reporting" 
            description="Build student progress reports with a few clicks. Generate constructive, professional comments tailored for parents or administrators with AI assistance." 
          />
          <FeatureCard 
            icon={<UsersIcon className="w-6 h-6" />} 
            title="Student Management" 
            description="Keep all student information in one place. Track points, manage toilet passes, and add behavioral notes effortlessly." 
          />
           <FeatureCard 
            icon={<PencilSquareIcon className="w-6 h-6" />} 
            title="Collaborative Whiteboard" 
            description="A real-time digital whiteboard for your classroom. Save snapshots of your lessons and collaborate with students instantly." 
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-12 bg-muted rounded-2xl">
         <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready to Transform Your Classroom?</h2>
         <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Join hundreds of teachers who are streamlining their workflow and creating more effective learning environments.
          </p>
          <div className="mt-8">
            <button 
              onClick={onGetStartedClick}
              className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all transform hover:scale-105"
            >
              Sign Up and Get Started
            </button>
          </div>
      </section>
    </div>
  );
};

export default HomePage;
