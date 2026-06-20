'use client';
import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import Image from 'next/image';
import { optimizeCloudinary } from "@/lib/utils";
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SquarePen, Trash2, Upload, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import DeleteConfirmation from "@/components/DeleteConfirmation/Confirmation";
import { cn } from '@/lib/utils';

export default function Category() {
    const [mode, setMode] = useState('category'); // 'category' or 'subcategory'
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        image: null,
        category_id: ''
    });
    const [editMode, setEditMode] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [errors, setErrors] = useState({});
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        itemId: null
    });
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryPage, setCategoryPage] = useState(1);
    const [subcategoryPage, setSubcategoryPage] = useState(1);
    const [categorySearch, setCategorySearch] = useState('');
    const [subcategorySearch, setSubcategorySearch] = useState('');

    // Regex patterns for validation
    const nameRegex = /^[A-Za-z0-9\s\-_]{2,50}$/;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 2MB)          
             if (file.size > 10 * 1024 * 1024) {
                toast.error('Image size should not exceed 10MB');
                return;
            }
            
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/gif','image/webp'].includes(file.type)) {
                toast.error('Only JPEG, PNG, GIF and WEBP images are allowed');
                return;
            }
            
            setFormData(prev => ({ ...prev, image: file }));
            setPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, image: '' }));
        }
    };    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        // Validate name with regex first
        if (!formData.name.trim()) {
            tempErrors.name = 'Name is required';
            toast.error('Category name is required');
            isValid = false;
        } else if (!nameRegex.test(formData.name)) {
            tempErrors.name = 'Name should be 2-50 characters and can contain letters, numbers, spaces, hyphens and underscores';
            toast.error('Invalid category name format');
            isValid = false;
        }

        // Then validate image for new categories
        if (!editMode && !formData.image) {
            toast.error('Please upload an image for Before Submitting', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored"
            });
            document.getElementById('thumbnail-upload').focus();
            tempErrors.image = 'Image is required';
            isValid = false;
        }

        // Validate category_id for subcategories
        if (mode === 'subcategory' && !formData.category_id) {
            tempErrors.category_id = 'Parent category is required';
            toast.error('Please select a parent category');
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // For new categories, check if image exists
        if (!editMode && !formData.image) {
            toast.error('Please upload an image for creating category', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored"
            });
            return;
        }
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }
        if (mode === 'subcategory') {
            formDataToSend.append('category_id', formData.category_id);
        }
        formDataToSend.append('_method', editMode ? 'PUT' : 'POST');

        const endpoint = mode === 'category' ? 'categories' : 'subcategories';

        try {
            if (editMode) {
                await axios.post(`/api/admin/${endpoint}/${formData.id}`, formDataToSend);
                toast.success(`${mode === 'category' ? 'Category' : 'Subcategory'} updated successfully!`);
            } else {
                await axios.post(`/api/admin/${endpoint}`, formDataToSend);
                toast.success(`${mode === 'category' ? 'Category' : 'Subcategory'} created successfully!`);
            }
            resetForm();
            fetchCategories();
            if (mode === 'subcategory') fetchSubCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ id: null, name: '', image: null, category_id: '' });
        setPreview(null);
        setEditMode(false);
        setErrors({});
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setIsEditDialogOpen(true);
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/admin/categories');
            const categoriesWithValidUrls = response.data.map(category => ({
                ...category,
                image_url: category.image
            }));
            setCategories(categoriesWithValidUrls);        } catch (error) {
            // console.error('Failed to fetch categories:', error);
            toast.error('Failed to fetch categories');
        }
    };

    const fetchSubCategories = async () => {
        try {
            const response = await axios.get('/api/admin/subcategories');
            setSubCategories(response.data);        } catch (error) {
            // console.error('Failed to fetch subcategories:', error);
            toast.error('Failed to fetch subcategories');
        }
    };

    const handleDelete = (id) => {
        setDeleteConfirmation({
            isOpen: true,
            itemId: id
        });
    };

    const confirmDelete = async () => {
        try {
            const endpoint = mode === 'category' ? 'categories' : 'subcategories';
            await axios.delete(`/api/admin/${endpoint}/${deleteConfirmation.itemId}`);
            if (mode === 'category') {
                fetchCategories();
            } else {
                fetchSubCategories();
            }
            toast.success(`${mode === 'category' ? 'Category' : 'Subcategory'} deleted successfully`);        } catch (error) {
            // console.error(`Failed to delete ${mode}:`, error);
            toast.error(`Failed to delete ${mode}`);
        }finally {
            setDeleteConfirmation({ isOpen: false, itemId: null });
        }
    };

    useEffect(() => {
        fetchCategories();
        if (mode === 'subcategory') {
            fetchSubCategories();
        }
    }, [mode]);

    // Update pagination state when mode changes
    useEffect(() => {
        if (mode === 'category') {
            setCurrentPage(categoryPage);
            setSearchTerm(categorySearch);
        } else {
            setCurrentPage(subcategoryPage);
            setSearchTerm(subcategorySearch);
        }
    }, [mode, categoryPage, categorySearch, subcategoryPage, subcategorySearch]);

    // Filter data based on search
    const getFilteredData = () => {
        const currentData = mode === 'category' ? categories : subCategories;
        return currentData.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (mode === 'subcategory') {
                const parentCategoryName = categories.find(c => c.id === item.category_id)?.name || '';
                const parentMatch = parentCategoryName.toLowerCase().includes(searchTerm.toLowerCase());
                return nameMatch || parentMatch;
            }
            return nameMatch;
        });
    };

    // Calculate pagination
    const filteredData = getFilteredData();
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Handle search change
    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        setCurrentPage(1); // Reset to first page when searching
        
        // Save search state
        if (mode === 'category') {
            setCategorySearch(newSearchTerm);
            setCategoryPage(1);
        } else {
            setSubcategorySearch(newSearchTerm);
            setSubcategoryPage(1);
        }
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        
        // Save page state
        if (mode === 'category') {
            setCategoryPage(pageNumber);
        } else {
            setSubcategoryPage(pageNumber);
        }
    };

    const validateEditForm = (data) => {
        let tempErrors = {};
        let isValid = true;

        // Validate name with regex
        if (!data.name.trim()) {
            tempErrors.name = 'Name is required';
            isValid = false;
        } else if (!nameRegex.test(data.name)) {
            tempErrors.name = 'Name should be 2-50 characters and can contain letters, numbers, spaces, hyphens and underscores';
            isValid = false;
        }

        // Validate category_id for subcategories
        if (mode === 'subcategory' && !data.category_id) {
            tempErrors.category_id = 'Parent category is required';
            isValid = false;
        }

        return { isValid, errors: tempErrors };
    };

    const handleSaveEditedCategory = async (updatedCategory) => {
        const { isValid, errors: validationErrors } = validateEditForm(updatedCategory);
        
        if (!isValid) {
            Object.values(validationErrors).forEach(error => {
                toast.error(error);
            });
            return;
        }
        
        setIsSubmitting(true);
        
        const formDataToSend = new FormData();
        formDataToSend.append('name', updatedCategory.name);
        if (updatedCategory.newImage) {
            formDataToSend.append('image', updatedCategory.newImage);
        }
        if (mode === 'subcategory' && updatedCategory.category_id) {
            formDataToSend.append('category_id', updatedCategory.category_id);
        }
        formDataToSend.append('_method', 'PUT');

        const endpoint = mode === 'category' ? 'categories' : 'subcategories';

        try {
            await axios.post(`/api/admin/${endpoint}/${updatedCategory.id}`, formDataToSend);
            toast.success(`${mode === 'category' ? 'Category' : 'Subcategory'} updated successfully!`);
            setIsEditDialogOpen(false);
            
            // Refresh data
            fetchCategories();
            if (mode === 'subcategory') fetchSubCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 p-3 md:p-6">
            <Card className="shadow-lg p-3 md:p-6">
                <div>
                    {/* Tabs */}
                    <div className="flex justify-center mb-6 md:mb-8">
                        <div className="bg-white rounded-lg p-1 shadow-sm border w-full max-w-md">
                            <div className="flex space-x-1">
                                <button
                                    className={`px-4 py-2 md:px-8 md:py-3 rounded-md text-base md:text-lg font-medium transition-all duration-200 flex-1 ${
                                        mode === 'category'
                                            ? 'bg-[#eb1c75] text-white shadow-sm transform scale-100'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-100'
                                    }`}
                                    onClick={() => { 
                                        // Save current state before switching
                                        if (mode === 'subcategory') {
                                            setSubcategoryPage(currentPage);
                                            setSubcategorySearch(searchTerm);
                                        }
                                        setMode('category'); 
                                        resetForm(); 
                                    }}
                                >
                                    Category
                                </button>
                                <button
                                    className={`px-4 py-2 md:px-8 md:py-3 rounded-md text-base md:text-lg font-medium transition-all duration-200 flex-1 ${
                                        mode === 'subcategory'
                                            ? 'bg-[#eb1c75] text-white shadow-sm transform scale-100'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-100'
                                    }`}
                                    onClick={() => { 
                                        // Save current state before switching
                                        if (mode === 'category') {
                                            setCategoryPage(currentPage);
                                            setCategorySearch(searchTerm);
                                        }
                                        setMode('subcategory'); 
                                        resetForm(); 
                                    }}
                                >
                                    Sub Category
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    {mode === 'category' ? (
                        <CategoryForm
                            preview={preview}
                            setPreview={setPreview}
                            formData={formData}
                            setFormData={setFormData}
                            handleImageChange={handleImageChange}
                            handleSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            errors={errors}
                        />
                    ) : (
                        <SubCategoryForm
                            preview={preview}
                            setPreview={setPreview}
                            formData={formData}
                            setFormData={setFormData}
                            categories={categories}
                            handleImageChange={handleImageChange}
                            handleSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            errors={errors}
                        />
                    )}

                    {/* Search Section */}
                    <div className="mt-8 mb-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder={`Search ${mode === 'category' ? 'categories' : 'subcategories'}...`}
                                className="pl-10 pr-4 py-2 w-full"
                            />
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="w-full overflow-hidden rounded-lg">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#eb1c75] text-white text-sm md:text-base font-semibold">
                                    <TableRow>
                                        <TableHead className="text-white text-center">Thumbnail</TableHead>
                                        <TableHead className="text-white text-center">Category Name</TableHead>
                                        {mode === 'subcategory' && (
                                            <TableHead className="text-white text-center">Parent Category</TableHead>
                                        )}
                                        <TableHead className="text-white text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center p-2 md:p-4">
                                                <div className="flex justify-center items-center">
                                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-md overflow-hidden">
                                                        <Image
                                                            src={optimizeCloudinary(item.image)}
                                                            alt={item.name}
                                                            width={96}
                                                            height={96}
                                                            className="w-full h-full object-cover"
                                                            unoptimized={true}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{item.name}</TableCell>
                                            {mode === 'subcategory' && (
                                                <TableCell className="text-center">
                                                    {categories.find(c => c.id === item.category_id)?.name}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-center justify-center p-2">
                                                <div className="flex justify-center space-x-1 md:space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-9 w-9">
                                                        <SquarePen className="h-5 w-5 md:h-7 md:w-7" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 h-9 w-9"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <Trash2 className="h-5 w-5 md:h-7 md:w-7" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Section */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </div>
                    
                            <div className="flex items-center space-x-2">
                                {totalPages > 0 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="h-8 w-8"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                    
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                // If 5 or fewer pages, show all page numbers
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                // If near the start, show first 5 pages
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                // If near the end, show last 5 pages
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                // Show current page and 2 pages before and after
                                                pageNum = currentPage - 2 + i;
                                            }
                    
                                            return (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`h-8 w-8 ${
                                                        currentPage === pageNum ? "bg-pink-500 text-white" : ""
                                                    }`}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                    
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className="h-8 w-8"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Results Message */}
                    {filteredData.length === 0 && searchTerm && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                No {mode === 'category' ? 'categories' : 'subcategories'} found matching &quot;{searchTerm}&quot;
                            </p>
                        </div>
                    )}

                    <EditCategoryDialog
                        isOpen={isEditDialogOpen}
                        onClose={() => setIsEditDialogOpen(false)}
                        category={editingCategory}
                        mode={mode}
                        categories={categories}
                        onSave={handleSaveEditedCategory}
                        isSubmitting={isSubmitting}
                    />

                    <DeleteConfirmation
                        isOpen={deleteConfirmation.isOpen}
                        onClose={() => setDeleteConfirmation({ isOpen: false, itemId: null })}
                        onDelete={confirmDelete}
                        title={`Delete ${mode === 'category' ? 'Category' : 'Subcategory'}`}
                        description={`Are you sure you want to delete this ${mode}? This action cannot be undone.`}
                    />
                </div>
            </Card>
        </div>
    );
}

// Category Form Component
function CategoryForm({ preview, setPreview, formData, setFormData, handleImageChange, handleSubmit, isSubmitting, errors }) {
    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        if (typeof window !== 'undefined') {
            URL.revokeObjectURL(preview);
        }
        if (typeof window !== 'undefined') {
            setTimeout(() => setPreview(null), 0);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="mb-6 md:mb-8">
            <p className="text-sm text-red-600 font-medium mb-4 text-center">
                <strong>Recommended size:</strong> 1080 × 1080 pixels for best display quality
            </p>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center">
                {/* Image Upload */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400 relative">
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                alt="Category thumbnail"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-600 border border-red-200 hover:bg-red-100"
                                aria-label="Remove image"
                            >
                                Remove
                            </button>
                        </>
                    ) : (
                        <label htmlFor="thumbnail-upload" className="cursor-pointer">
                            <Upload className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                            <input
                                id="thumbnail-upload"
                                name="thumbnail"
                                type="file"
                                className="hidden"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </label>
                    )}
                </div>
                {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}

                {/* Form Fields */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 w-full">
                    <div className="w-full">
                        <label htmlFor="category-name" className="block text-sm font-medium mb-1">
                            Category Name
                        </label>
                        <Input
                            id="category-name"
                            placeholder="Enter category name"
                            className={`w-full md:w-[300px] lg:w-[500px] p-2 ${errors.name ? 'border-red-500' : ''}`}
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div className="pt-3 md:pt-6 w-full md:w-auto">
                        <Button 
                            type="submit" 
                            className="bg-[#eb1c75] hover:bg-pink-600 text-white px-6 w-full md:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}

// Sub Category Form Component
function SubCategoryForm({ preview, setPreview, formData, setFormData, categories, handleImageChange, handleSubmit, isSubmitting, errors }) {
    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        if (typeof window !== 'undefined') {
            URL.revokeObjectURL(preview);
        }
        if (typeof window !== 'undefined') {
            setTimeout(() => setPreview(null), 0);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="mb-6 md:mb-10">
            <p className="text-sm text-red-600 font-medium mb-4 text-center">
                <strong>Recommended size:</strong> 1200 × 1600 pixels for best display quality
            </p>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center">
                {/* Image Upload */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400 relative">
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                alt="Category thumbnail"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-600 border border-red-200 hover:bg-red-100"
                                aria-label="Remove image"
                            >
                                Remove
                            </button>
                        </>
                    ) : (
                        <label htmlFor="thumbnail-upload" className="cursor-pointer">
                            <Upload className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                            <input
                                id="thumbnail-upload"
                                name="thumbnail"
                                type="file"
                                className="hidden"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </label>
                    )}
                </div>
                {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}

                {/* Form Fields */}
                <div className="flex flex-col items-center justify-center gap-3 md:gap-4 w-full">
                    <div className="space-y-3 md:space-y-4 w-full">
                        <div>
                            <label htmlFor="category-select" className="block text-sm font-medium mb-1">
                                Parent Category
                            </label>
                            <select
                                id="category-select"
                                value={formData.category_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-md ${errors.category_id ? 'border-red-500' : ''}`}
                                required
                            >
                                <option value="">Select a parent category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>}
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                            <div className="w-full">
                                <label htmlFor="subcategory-name" className="block text-sm font-medium mb-1">
                                    Sub Category Name
                                </label>
                                <Input
                                    id="subcategory-name"
                                    placeholder="Enter sub category name"
                                    className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            </div>
                            <div className="pt-3 md:pt-6 w-full md:w-auto">
                                <Button 
                                    type="submit" 
                                    className="bg-[#eb1c75] hover:bg-pink-600 text-white px-6 w-full md:w-auto"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
// Edit Category Dialog Component
function EditCategoryDialog({ isOpen, onClose, category, mode, categories, onSave, isSubmitting }) {
    const [editedData, setEditedData] = useState({
        id: null,
        name: '',
        category_id: '',
        image: '',
        newImage: null
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (category) {
            setEditedData({
                id: category.id,
                name: category.name,
                category_id: category.category_id || '',
                image: category.image,
                newImage: null
            });
            setPreviewImage(category.image);
        }
    }, [category]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should not exceed 2MB');
                return;
            }
            
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/gif','image/webp'].includes(file.type)) {
                toast.error('Only JPEG, PNG and GIF images are allowed');
                return;
            }
            
            setEditedData(prev => ({ ...prev, newImage: file }));
            setPreviewImage(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, image: '' })); // Clear any image error
        }
    };

    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        // Validate name
        if (!editedData.name.trim()) {
            tempErrors.name = 'Name is required';
            isValid = false;
        } else if (editedData.name.length < 2) {
            tempErrors.name = 'Name should be at least 2 characters';
            isValid = false;
        }

        // Validate category_id for subcategories
        if (mode === 'subcategory' && !editedData.category_id) {
            tempErrors.category_id = 'Parent category is required';
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            Object.values(errors).forEach(error => {
                if (error) toast.error(error);
            });
            return;
        }
        
        if (!category) return;
        onSave(editedData);
    };

    // Prevent form submission when clicking the Choose Image button
    const handleChooseImage = (e) => {
        e.preventDefault(); // Prevent form submission
        document.getElementById("edit-thumbnail-upload").click();
    };

    if (!category) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-4 md:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-bold text-center">
                        Edit {mode === 'category' ? 'Category' : 'Subcategory'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 py-2 md:py-4">
                    <p className="text-sm text-red-600 font-medium text-center">
                        <strong>Recommended size:</strong> {mode === 'category' ? '1080 × 1080' : '1200 × 1600'} pixels for best display quality
                    </p>
                    {/* Image Upload */}
                    <div className="flex flex-col items-center gap-3 md:gap-4">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400">
                            {previewImage ? (
                                <Image
                                    src={previewImage}
                                    alt="Category thumbnail"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    unoptimized={true}
                                />
                            ) : (
                                <Upload className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                            )}
                        </div>
                        <Button
                            type="button" // Add type="button" to prevent form submission
                            onClick={handleChooseImage}
                            className="text-sm md:text-base"
                        >
                            Choose Image
                        </Button>
                        <input
                            id="edit-thumbnail-upload"
                            name="edit-thumbnail"
                            type="file"
                            className="hidden"
                            onChange={handleImageUpload}
                            accept="image/*"
                        />
                    </div>

                    {/* Category Name */}
                    <div>
                        <label htmlFor="edit-category-name" className="block text-sm font-medium mb-1">
                            {mode === 'category' ? 'Category' : 'Subcategory'} Name
                        </label>
                        <Input
                            id="edit-category-name"
                            value={editedData.name}
                            onChange={(e) => setEditedData(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Parent Category - Only show if mode is subcategory */}
                    {mode === 'subcategory' && (
                        <div>
                            <label htmlFor="edit-parent-category" className="block text-sm font-medium mb-1">
                                Parent Category
                            </label>
                            <select
                                id="edit-parent-category"
                                value={editedData.category_id}
                                onChange={(e) => setEditedData(prev => ({ ...prev, category_id: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-md ${errors.category_id ? 'border-red-500' : ''}`}
                                required
                            >
                                <option value="">Select a parent category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#eb1c75] hover:bg-pink-600 text-white w-full sm:w-auto order-1 sm:order-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

