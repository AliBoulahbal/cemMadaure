const mongoose = require('mongoose');
const LessonPart = require('../models/LessonPart');

async function migrate() {
    try {
        await mongoose.connect('mongodb://localhost:27017/madaureCEM');
        
        const parts = await LessonPart.find();
        let count = 0;
        
        for (const part of parts) {
            let modified = false;
            const documents = part.documents || [];
            
            // Migrer la vidéo existante
            if (part.url && part.url !== '') {
                const existingVideo = documents.find(d => d.type === 'VIDEO');
                if (!existingVideo) {
                    documents.push({
                        type: 'VIDEO',
                        title: part.title || 'Vidéo',
                        url: part.url,
                        duration: part.duration || 0,
                        isFree: part.isFree || false,
                        order: 0
                    });
                    modified = true;
                }
            }
            
            // Migrer le contenu existant (PDF/TEXT/QUIZ)
            if (part.body && part.body !== '') {
                let docType = 'PDF';
                if (part.type === 'TEXT') docType = 'TEXT';
                else if (part.type === 'QUIZ') docType = 'QUIZ';
                
                const existingDoc = documents.find(d => d.type === docType);
                if (!existingDoc) {
                    documents.push({
                        type: docType,
                        title: part.title + (docType === 'PDF' ? ' (PDF)' : ''),
                        content: part.body,
                        isFree: part.isFree || false,
                        order: documents.length
                    });
                    modified = true;
                }
            }
            
            if (modified) {
                part.documents = documents;
                await part.save();
                count++;
                console.log(`✅ Migré: ${part._id} - ${documents.length} documents`);
            }
        }
        
        console.log(`Migration terminée! ${count} documents mis à jour.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

migrate();