from django.contrib import admin
from .models import Classroom, ClassMembership, Equation, Parameter, UsageLog


class MembershipInline(admin.TabularInline):
    model = ClassMembership
    extra = 0
    readonly_fields = ('joined_at',)


class EquationInline(admin.TabularInline):
    model = Equation
    fields = ('title', 'equation_type', 'expression', 'is_public')
    extra = 0


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'subject', 'join_code', 'get_member_count', 'get_equation_count', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'teacher__username', 'join_code')
    readonly_fields = ('join_code', 'created_at', 'updated_at')
    inlines = [MembershipInline, EquationInline]

    def get_member_count(self, obj):
        return obj.get_member_count()
    get_member_count.short_description = 'Members'

    def get_equation_count(self, obj):
        return obj.get_equation_count()
    get_equation_count.short_description = 'Equations'


@admin.register(ClassMembership)
class ClassMembershipAdmin(admin.ModelAdmin):
    list_display = ('student', 'classroom', 'joined_at')
    list_filter = ('classroom', 'joined_at')
    search_fields = ('student__username', 'classroom__name')


class ParameterInline(admin.TabularInline):
    model = Parameter
    extra = 1


@admin.register(Equation)
class EquationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'classroom', 'equation_type', 'is_public', 'created_at')
    list_filter = ('equation_type', 'is_public', 'classroom', 'created_at')
    search_fields = ('title', 'expression', 'user__username')
    inlines = [ParameterInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'equation_type', 'timestamp', 'ip_address')
    list_filter = ('action', 'equation_type', 'timestamp')
    search_fields = ('action', 'user__username', 'expression')
    readonly_fields = ('timestamp',)
