from django.shortcuts import redirect
from django.contrib import messages
from functools import wraps


def teacher_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.warning(request, 'Please log in to access this page.')
            return redirect('login')
        if not (request.user.is_teacher() or request.user.is_admin_user()):
            messages.error(request, 'Access denied. Teacher or Admin role required.')
            return redirect('dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


def student_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.warning(request, 'Please log in to access this page.')
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper
