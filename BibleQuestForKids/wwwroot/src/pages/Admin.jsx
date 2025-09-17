import React, { useState, useEffect } from 'react';
import { Questions_Staging } from '@/api/entities';
import { Question } from '@/api/entities';
import { Books } from '@/api/entities';
import { User } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Upload, Trash2, RefreshCw, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const ClayCard = ({ children, className }) => (
    <div className={`clay-card p-6 ${className}`}>
        {children}
    </div>
);

export default function AdminPage() {
    const [user, setUser] = useState(null);
    const [validQuestions, setValidQuestions] = useState([]);
    const [invalidQuestions, setInvalidQuestions] = useState([]);
    const [orphanQuestions, setOrphanQuestions] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                if (currentUser.role !== 'admin') {
                    setIsLoading(false);
                    return; // Not admin, don't load admin data
                }
                await loadData();
            } catch (e) {
                // Not logged in
                setIsLoading(false);
            }
        };
        checkAdminAccess();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [stagingQuestions, allBooks, productionQuestions] = await Promise.all([
                Questions_Staging.list("-created_date", 500),
                Books.list("order_index"),
                Question.list("-created_date", 500)
            ]);

            setBooks(allBooks);
            
            // Normalize and filter staging questions
            const bookNames = new Set(allBooks.map(b => b.book));
            const processedStaging = stagingQuestions.map(q => ({
                ...q,
                normalized_book: bookNames.has(q.book_text) ? q.book_text : null
            }));

            const valid = processedStaging.filter(q => 
                (q.mode === 'books' && q.normalized_book) || 
                (q.mode === 'commandments')
            );
            setValidQuestions(valid);

            const invalid = processedStaging.filter(q => 
                (q.mode === 'books' && !q.normalized_book) ||
                !q.question ||
                !q.mode
            );
            setInvalidQuestions(invalid);

            // Find orphan production questions
            const orphans = productionQuestions.filter(q => 
                q.mode === 'books' && (!q.book || !bookNames.has(q.book))
            );
            setOrphanQuestions(orphans);

        } catch (error) {
            console.error('Error loading admin data:', error);
        }
        setIsLoading(false);
    };

    const promoteValidQuestions = async () => {
        const questionsToPromote = validQuestions.map(q => ({
            id: q.id, // Use staging ID to upsert
            mode: q.mode,
            book: q.mode === 'books' ? q.normalized_book : 'Commandments',
            commandment_number: q.commandment_number,
            question: q.question,
            question_type: q.question_type || 'mcq',
            choices: q.choices,
            answer_index: q.answer_index,
            true_is_correct: q.true_is_correct,
            correct_order: q.correct_order,
            order_items: q.order_items,
            hint: q.hint,
            explanation: q.explanation,
            scripture_ref: q.scripture_ref,
            difficulty: q.difficulty,
            image_url: q.image_url,
            origin_pack: q.origin_pack
        }));

        try {
            // Using bulkCreate for promotion, which will upsert based on ID.
            // NOTE: Base44 SDK does not have a direct bulkUpdate, but bulkCreate can often be configured to upsert.
            // If not, we fall back to individual updates.
            for (const qData of questionsToPromote) {
                 await Question.create(qData);
            }
            
            alert(`${questionsToPromote.length} valid questions promoted successfully!`);
        } catch (error) {
            console.error('Error promoting questions:', error);
            alert('Error promoting questions. Check console for details.');
        }
    };

    const clearPromoted = async () => {
        try {
            for (const question of validQuestions) {
                if (question.id) {
                    await Questions_Staging.delete(question.id);
                }
            }
            await loadData();
            alert('Promoted questions cleared from staging!');
        } catch (error) {
            console.error('Error clearing staging:', error);
        }
    };

    const deleteSelected = async (from, ids) => {
        if (ids.length === 0) return;
        try {
            const entity = from === 'staging' ? Questions_Staging : Question;
            for (const id of ids) {
                await entity.delete(id);
            }
            setSelectedItems([]);
            await loadData();
            alert('Selected items deleted!');
        } catch (error) {
            console.error('Error deleting items:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-2xl font-bold text-gray-600">Loading admin panel...</div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <ClayCard>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Admin access required.</p>
                </ClayCard>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
                <p className="text-gray-600">Manage questions and data quality</p>
            </div>

            <Tabs defaultValue="staging" className="w-full">
                <TabsList className="grid w-full grid-cols-3 clay-button p-1">
                    <TabsTrigger value="staging">Staging Review</TabsTrigger>
                    <TabsTrigger value="orphans">Orphan Questions</TabsTrigger>
                    <TabsTrigger value="books">Books Database</TabsTrigger>
                </TabsList>

                <TabsContent value="staging">
                    <div className="space-y-6">
                        <Tabs defaultValue="valid">
                            <TabsList className="grid w-full grid-cols-2 clay-button p-1">
                                <TabsTrigger value="valid">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Valid ({validQuestions.length})
                                </TabsTrigger>
                                <TabsTrigger value="invalid">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Invalid ({invalidQuestions.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="valid">
                                <ClayCard>
                                    <div className="flex gap-4 mb-4">
                                        <Button onClick={promoteValidQuestions} className="clay-button">
                                            <Database className="w-4 h-4 mr-2" />
                                            Promote Valid to Production
                                        </Button>
                                        <Button onClick={clearPromoted} variant="outline" className="clay-button">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Clear Promoted
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto p-2 clay-shadow-inset rounded-xl">
                                        {validQuestions.map(q => (
                                            <div key={q.id} className="p-3 bg-green-50 rounded-xl">
                                                <p className="font-medium">{q.question}</p>
                                                <p className="text-sm text-gray-600">
                                                    {q.mode} - <strong>{q.normalized_book || 'Commandments'}</strong> - {q.difficulty}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ClayCard>
                            </TabsContent>

                            <TabsContent value="invalid">
                                <ClayCard>
                                    <div className="flex gap-4 mb-4">
                                        <Button onClick={() => deleteSelected('staging', selectedItems)} variant="destructive" className="clay-button">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Selected ({selectedItems.length})
                                        </Button>
                                        <Button onClick={loadData} variant="outline" className="clay-button">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Re-Validate
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto p-2 clay-shadow-inset rounded-xl">
                                        {invalidQuestions.map(q => (
                                            <div key={q.id} className="p-3 bg-red-50 rounded-xl flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(q.id)}
                                                    onChange={(e) => {
                                                        setSelectedItems(e.target.checked ? [...selectedItems, q.id] : selectedItems.filter(id => id !== q.id));
                                                    }}
                                                    className="w-5 h-5"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium">{q.question}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {q.mode} - "{q.book_text}" - {q.difficulty}
                                                    </p>
                                                    <p className="text-xs text-red-600 font-bold">No valid book match found</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ClayCard>
                            </TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                <TabsContent value="orphans">
                    <ClayCard>
                        <h3 className="text-lg font-bold mb-4">Orphan Questions (Missing Book Relations)</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto p-2 clay-shadow-inset rounded-xl">
                            {orphanQuestions.map(q => (
                                <div key={q.id} className="p-3 bg-yellow-50 rounded-xl">
                                    <p className="font-medium">{q.question}</p>
                                    <p className="text-sm text-gray-600">
                                        Mode: {q.mode} - Pack: {q.origin_pack || 'Unknown'} - Book: {q.book || 'NULL'}
                                    </p>
                                </div>
                            ))}
                            {orphanQuestions.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No orphan questions found!</p>
                            )}
                        </div>
                    </ClayCard>
                </TabsContent>

                <TabsContent value="books">
                    <ClayCard>
                        <h3 className="text-lg font-bold mb-4">Books Database ({books.length} books)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {books.map(book => (
                                <div key={book.id} className="p-3 bg-blue-50 rounded-xl text-center">
                                    <p className="font-bold text-sm">{book.book}</p>
                                    <p className="text-xs text-gray-600">{book.testament} #{book.order_index}</p>
                                </div>
                            ))}
                        </div>
                    </ClayCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}