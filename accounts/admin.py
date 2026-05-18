from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Profile', {'fields': ('role', 'bio')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role & Profile', {'fields': ('role', 'email')}),
    )
    search_fields = ('username', 'email', 'role')
    ordering = ('-created_at',)
